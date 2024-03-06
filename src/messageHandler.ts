import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { Server, Socket } from "socket.io";
import OpenAI from "openai";
import {
  ChatCompletionChunk,
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
}

// In-memory recording state storage
const recordingStates: Record<string, boolean> = {};

// Util function to start the Deepgram connection
function startDeepgramConnection(socket: ExtendedSocket) {
  const connection = deepgramClient.listen.live({
    punctuate: true,
    smart_format: true,
    model: "nova-2",
    language: "fr",
  });

  // Store the connection in the socket for later reference
  socket.deepgramConnection = connection;
  socket.deepgramReady = false;

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
    if (socket.deepgramReady) { // Check if the connection is ready
      const transcript = data.channel.alternatives[0].transcript;
      console.log("Transcript: ", transcript);
      socket.emit('message', transcript);
    }
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

const systemMessage: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `
  You are a vocal assistant that responds to user questions.
  User speech will be converted to text and sent to you as a messages.
  Sometimes the sentences will be incomplete respond nothing in this case.
  Start responding to the user when you detect a question.
    `,
};

const gpt = async (socket: Socket) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.1,
    messages: [
      systemMessage,
      { role: "user", content: "What is the capital of France?" },
    ],
    stream: true,
  });
  const reader = response.toReadableStream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const data = <ChatCompletionChunk>(
      JSON.parse(new TextDecoder("utf-8").decode(value))
    );
    const message = data.choices[0]?.delta.content;
    console.log("Response GPT", message);
    socket.emit("response", message);
  }
  console.log("GPT done");
};

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

  socket.on("gpt", async () => {
    console.log("gpt request received");
    await gpt(socket);
  });

  // Adjust the socket.on("disconnect") listener to handle cleanup properly
  socket.on("disconnect", () => {
    stopDeepgramConnection(socket as ExtendedSocket);
    socket.deepgramReady = false;
    delete recordingStates[socket.id];
    console.log("A user disconnected. Cleaning up state for socket", socket.id);
  });

}
