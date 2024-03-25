import { createVocalizer } from "./streams/vocalizer";
import { Socket } from "socket.io";
import { ServerEvents, State } from "./types";

// Keep track of recording states for each connected client
const states: Record<string, State> = {};

export const messageHandler = (socket: Socket<ServerEvents>): void => {
  console.log("A user connected", socket.id);

  // Handle recording state changes
  socket.on("assistantSetRecording", async ({ isRecording }) => {
    console.log("assistantSetRecording", isRecording);
    if (isRecording) {
      const vocalizer = await createVocalizer({
        onTranscript: (transcript, index, isFinal) => {
          socket.emit("assistantOnTranscript", { transcript, index, isFinal });
        },
        onAnswer: (answer, index, isFinal) => {
          socket.emit("assistantOnAnswer", { answer, index, isFinal });
        },
        onSynthesize: (audioBase64, index) => {
          socket.emit("assistantOnSynthesize", { audioBase64, index });
        },
      });

      states[socket.id] = { vocalizer };
    } else {
      // Close stream and clear state
      states[socket.id]?.vocalizer?.close();
      delete states[socket.id];
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected. Cleaning up state for socket", socket.id);
    // Close the stream and clear state
    states[socket.id]?.vocalizer?.close();
    delete states[socket.id];
  });

  socket.on("assistantOnListen", ({ audioChunk }) => {
    states[socket.id]?.vocalizer?.send(audioChunk);
  });
};
