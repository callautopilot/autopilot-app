import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { Server, Socket } from "socket.io";
import OpenAI from "openai";
import {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
} from "openai/resources";

// External APIs
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY!);
// Extend the Socket type to include deepgramConnection
interface ExtendedSocket extends Socket {
  deepgramConnection?: ReturnType<typeof deepgramClient.listen.live>;
  deepgramReady?: boolean;
  conversationHistory?: { role: string; content: string }[];
  gptReady?: boolean;
}

const systemMessage: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `
  You are a helpful vocal assistant that responds to user questions.
  Never say "How can I help you today" or anything alike, this is useless in this case.
  User speech will be converted to text and sent to you as a messages.
  Sometimes the sentences will be incomplete respond NOTHING in this case, en empty text response.
  Start responding to the user when you detect a question.
  `,
};


// In-memory recording state storage
const recordingStates: Record<string, boolean> = {};

// Util function to start the Deepgram connection
function startDeepgramConnection(socket: ExtendedSocket) {
  const connection = deepgramClient.listen.live({
    punctuate: true,
    smart_format: true,
    model: "nova-2",
    language: "en",
  });

  // Store the connection in the socket for later reference
  socket.deepgramConnection = connection;
  socket.deepgramReady = false;
  socket.conversationHistory = [systemMessage];
  socket.gptReady = true;
  let transcriptBuffer = "";

  const sendToGpt = async () => {
    if (socket.gptReady) {
      socket.gptReady = false;

      // Initialize conversationHistory if it's undefined
      if (!socket.conversationHistory) {
        socket.conversationHistory = [systemMessage]; // Initialize with the system message
      }

      socket.conversationHistory.push({ role: "user", content: transcriptBuffer });
      transcriptBuffer = ""; // Clear the buffer

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.1,
        messages: socket.conversationHistory as ChatCompletionMessageParam[],
        stream: true,
      });
    
      const reader = response.toReadableStream().getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          socket.gptReady = true; // Set GPT back to ready AFTER processing is complete
          break;
        }
        const data = <ChatCompletionChunk>(JSON.parse(new TextDecoder("utf-8").decode(value)));
        const message = data.choices[0]?.delta.content;
        console.log("response from GPT:", message);
        socket.emit("response", message);
        // socket.conversationHistory.push({ role: "assistant", content: message });
      }
    }
  };

  const handleNewTranscript = (transcript: string) => {
    transcriptBuffer += transcript;
    // Attempt to send to GPT if ready and buffer has enough content
    if (socket.gptReady && transcriptBuffer.length >= 30) {
      sendToGpt();
    }
  };

  // Keep-alive logic specific to this connection
  let keepAlive = setInterval(() => {
    console.log("deepgram: keepalive for socket", socket.id);
    if (socket.deepgramConnection) {
      socket.deepgramConnection.keepAlive();
    }
  }, 10 * 1000);

  connection.on('open', () => {
    console.log('Deepgram connection opened for', socket.id);
    socket.deepgramReady = true;
  });

  // Handle incoming transcripts
  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel.alternatives[0].transcript;
    handleNewTranscript(transcript);
    console.log("Transcript: ", transcript);
    socket.emit('message', transcript);
  });

  connection.on('close', () => {
    clearInterval(keepAlive);
    socket.deepgramReady = false;
    console.log('Deepgram connection closed for', socket.id);
  });

  connection.on('error', error => {
    console.error('Deepgram error for', socket.id, ':', error);
  });
}

// Util function to stop the Deepgram connection
function stopDeepgramConnection(socket: ExtendedSocket) {
  if (socket.deepgramConnection) {
    socket.deepgramConnection.finish();
    socket.deepgramConnection = undefined;
    console.log('Deepgram connection closed for socket', socket.id);
  }
}

export function handleMessages(io: Server, socket: ExtendedSocket) {
  console.log("A user connected", socket.id);

  socket.on("recordingStateChange", (data: { isRecording: boolean }) => {
    console.log("Recording state changed for socket ID", socket.id, ":", data.isRecording);
    recordingStates[socket.id] = data.isRecording;
    
    // Start or stop the Deepgram connection based on the isRecording state
    if (data.isRecording) {
      startDeepgramConnection(socket);
    } else {
      stopDeepgramConnection(socket);
    }
  });

  socket.on("recordingStateChange", (data: { isRecording: boolean }) => {
    console.log("Recording state changed for socket ID", socket.id, ":", data.isRecording);
    recordingStates[socket.id] = data.isRecording;
  });

  socket.on("mp3", (audio) => {
    if (socket.deepgramConnection && socket.deepgramReady) {
      const buffer = Buffer.from(audio);
      socket.deepgramConnection.send(buffer);
    }
  });
  
  // Adjust the socket.on("disconnect") listener to handle cleanup properly
  socket.on("disconnect", () => {
    stopDeepgramConnection(socket as ExtendedSocket);
    socket.deepgramReady = false;
    delete recordingStates[socket.id];
    console.log("A user disconnected. Cleaning up state for socket", socket.id);
  });

}
