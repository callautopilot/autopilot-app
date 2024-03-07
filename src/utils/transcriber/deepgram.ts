import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { ExtendedSocket } from "../types";

const deepgramApiKey = process.env.DEEPGRAM_API_KEY as string;
const deepgramClient = createClient(deepgramApiKey);

export const startDeepgramConnection = (socket: ExtendedSocket, handleTranscript: (transcript: string, socket: ExtendedSocket) => void): void => {

  const connection = deepgramClient.listen.live({
    punctuate: true,
    smart_format: true,
    model: "nova-2",
    language: "en",
  });

  socket.deepgramConnection = connection;
  socket.deepgramReady = false; // Initially not ready until the 'open' event is triggered
  let keepAliveInterval: NodeJS.Timeout;

  connection.on('open', () => {
    console.log('Deepgram connection opened for socket ID', socket.id);
    socket.deepgramReady = true;
    keepAliveInterval = setInterval(() => {
      console.log("Sending keepalive for socket", socket.id);
      if (socket.deepgramConnection) {
        socket.deepgramConnection.keepAlive();
      }
    }, 10000); // Send keepalive every 10 seconds
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    if (!data.is_final) return; // Process only final transcripts to avoid duplicates
    
    const transcript = data.channel.alternatives[0].transcript;
    socket.emit('message', transcript);
    console.log("Transcript (final):", transcript);
    
    // Handle new transcript
    handleTranscript(transcript, socket);
  });

  connection.on('close', () => {
    clearInterval(keepAliveInterval);
    stopDeepgramConnection(socket);
  });

  connection.on('error', error => {
    console.error('Deepgram error for socket ID', socket.id, ':', error);
  });

  socket.on("audio", (audioChunk) => {
    if (socket.deepgramConnection && socket.deepgramReady) {
      const buffer = Buffer.from(audioChunk);
      socket.deepgramConnection.send(buffer);
    }
  });
};

export const stopDeepgramConnection = (socket: ExtendedSocket): void => {
  if (socket.deepgramConnection) {
    socket.deepgramConnection.finish();
    console.log('Deepgram connection closed for socket ID', socket.id);
    socket.deepgramReady = false;
  }
};
