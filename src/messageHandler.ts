import { Server } from "socket.io";
import { ExtendedSocket } from "./utils/types";
import { startDeepgramConnection, stopDeepgramConnection } from "./utils/transcriber/deepgram";
import { initializeAgent, sendToGpt } from "./utils/agent/openai";

// Keep track of recording states for each connected client
const recordingStates: Record<string, boolean> = {};

export const handleMessages = (io: Server, socket: ExtendedSocket): void => {
  console.log("A user connected", socket.id);

  // Initialize GPT agent state
  initializeAgent(socket);

  // Handle recording state changes
  socket.on("recordingStateChange", (data: { isRecording: boolean }) => {
    console.log("Recording state changed for socket ID", socket.id, ":", data.isRecording);

    recordingStates[socket.id] = data.isRecording;

    if (data.isRecording) {
      // Start Deepgram connection and handle transcripts
      startDeepgramConnection(socket, handleTranscript);
    } else {
      // Stop Deepgram connection when not recording
      stopDeepgramConnection(socket);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected. Cleaning up state for socket", socket.id);

    stopDeepgramConnection(socket);
    delete recordingStates[socket.id];
    socket.deepgramReady = false;
  });

  // Define how to handle new transcripts from Deepgram
  function handleTranscript(transcript: string, socket: ExtendedSocket): void {
    if (socket.gptReady && (socket.transcriptBuffer || '').length + transcript.length >= 25) {
      // Append new transcript to buffer and send if enough content has accumulated
      socket.transcriptBuffer += transcript;
      sendToGpt(socket.transcriptBuffer ?? '', socket)
        // Clear buffer after sending
        .then(() => socket.transcriptBuffer = '')
        .catch(err => console.error("Error sending to GPT:", err));
    } else {
      // Accumulate transcripts in buffer if not enough content or GPT not ready
      socket.transcriptBuffer = (socket.transcriptBuffer || '') + transcript;
    }
  }
};
