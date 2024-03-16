import { Server } from "socket.io";
import { Vocalizer, createVocalizer } from "./streams/vocalizer";
import { Socket } from "socket.io";

// Keep track of recording states for each connected client
const streams: Record<string, Vocalizer> = {};

export const messageHandler = (io: Server, socket: Socket): void => {
  console.log("A user connected", socket.id);

  // Handle recording state changes
  socket.on("recordingStateChange", async (data: { isRecording: boolean }) => {
    console.log("recordingStateChange", data.isRecording);
    if (data.isRecording) {
      streams[socket.id] = await createVocalizer({
        onTranscript: (transcript) => {
          socket.emit("transcript", transcript);
        },
        onAnswer: (answer) => {
          socket.emit("answer", answer);
        },
        onSynthesize: (audioBase64) => {
          socket.emit("elevenlab", audioBase64);
        },
      });
    } else {
      // Close stream and clear state
      streams[socket.id]?.close();
      delete streams[socket.id];
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected. Cleaning up state for socket", socket.id);
    // Close the stream and clear state
    streams[socket.id]?.close();
    delete streams[socket.id];
  });

  socket.on("audio", (audioChunk) => {
    streams[socket.id]?.send?.(audioChunk);
  });
};
