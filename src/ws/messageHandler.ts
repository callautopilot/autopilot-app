import { createVocalizer } from "./streams/vocalizer";
import { Socket } from "socket.io";
import { ServerEvents, State } from "./types";
import { setEnvVars } from "@/ws/runtimeEnv";
import { createPlayer } from "./streams/player";
import { createRecorder } from "./streams/recorder";

const RECORD_AUDIO_TO_FILE = false;
const PLAY_RECORDED_AUDIO = false;
const AUDIO_DIR = "./audio";

// Keep track of recording states for each connected client
const states: Record<string, State> = {};

export const messageHandler = (socket: Socket<ServerEvents>): void => {
  console.log("A user connected", socket.id);

  // Handle recording state changes
  socket.on("assistantSetRecording", async ({ isRecording }) => {
    console.log("assistantSetRecording", isRecording);
    const recorder = RECORD_AUDIO_TO_FILE
      ? createRecorder({
          audioDir: "./audio",
        })
      : undefined;
    if (isRecording) {
      if (PLAY_RECORDED_AUDIO) {
        createPlayer({
          audioDir: AUDIO_DIR,
          onPlay: (audioBase64, index, isFinal, _timestamp) => {
            socket.emit("assistantOnSynthesize", {
              audioBase64,
              index,
              isFinal,
            });
          },
        });
        return;
      }

      const vocalizer = await createVocalizer({
        socketId: socket.id,
        onTranscript: (transcript, index, isFinal) => {
          socket.emit("assistantOnTranscript", { transcript, index, isFinal });
        },
        onAnswer: (answer, index, isFinal) => {
          socket.emit("assistantOnAnswer", { answer, index, isFinal });
        },
        onSynthesize: (audioBase64, index, isFinal) => {
          socket.emit("assistantOnSynthesize", { audioBase64, index, isFinal });
          if (recorder === undefined) return;
          recorder(audioBase64, index, isFinal);
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

  socket.on("envVars", (envVars) => {
    console.log("Received environment variables from the front-end:", envVars);
    setEnvVars(socket.id, envVars);
  });
};
