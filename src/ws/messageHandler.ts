import { State } from "@/ws/types";
import { getAnswerer, initialMessage } from "@/ws/streams/answerer";
import { debounce } from "lodash";
import { getSynthesizer } from "@/ws/streams/synthesizer";
import { getTranscriber } from "@/ws/streams/transcriber";
import { Socket } from "socket.io";

// Keep track of recording states for each connected client
const states: Record<string, State> = {};

export const messageHandler = (socket: Socket): void => {
  console.log("A user connected", socket.id);

  // Handle recording state changes
  socket.on("recordingStateChange", async (data: { isRecording: boolean }) => {
    console.log("recordingStateChange", data.isRecording);
    if (data.isRecording) {
      // Create a new state for the socket
      states[socket.id] = {
        transcript: "",
        messages: [initialMessage],
        counter: 0,
      };

      const handleTranscript = async () => {
        console.log("handleTranscript", states[socket.id].transcript);

        // Extract the current transcript from the state
        const transcript = states[socket.id].transcript;

        // Extract the current counter from the state
        const counter = states[socket.id].counter;

        // Increment the counter and clear the transcript in the state
        states[socket.id] = {
          ...states[socket.id],
          counter: counter + 1,
          transcript: "",
        };

        // Create a text-to-speech stream
        const textToSpeechCallback = (data: string) => {
          //console.log("textToSpeechCallback");
          socket.emit("elevenlab", { data: data, counter: counter });
        };
        const synthesizer = await getSynthesizer(textToSpeechCallback);

        // Store the text-to-speech close function in the state
        states[socket.id].synthesizerClose = synthesizer.close;

        // Define the callback for the text-to-text stream
        const textToTextCallback = (data: string) => {
          synthesizer.send(data);
          socket.emit("agentResponse", { data: data, counter: counter });
        };

        // Update the state with the new messages
        const messages = states[socket.id].messages;
        messages.push({ role: "user", content: transcript });
        states[socket.id].messages = messages;

        // Create a new text-to-text stream
        const answerer = getAnswerer(messages, textToTextCallback);

        // Store the text-to-text close function in the state
        states[socket.id].answererClose = answerer.close;

        // Wait for the the text-to-text stream final response and update the state with the agent response
        answerer.response.then((response) => {
          //console.log("final response", response);
          synthesizer.send(" ", true);
          states[socket.id].messages.push({
            role: "assistant",
            content: response,
          });
        });
      };
      const handleTranscriptDebounced = debounce(handleTranscript, 1000);

      const speechToTextCallback = async (data: string) => {
        console.log("speechToTextCallback", data);

        if (!states[socket.id]) return;

        // Store the transcript in the state
        states[socket.id].transcript += data;

        // Emit the transcript to the client
        socket.emit("message", {
          data: data,
          counter: states[socket.id].counter,
        });

        handleTranscriptDebounced();
      };

      // Create a new speech-to-text stream
      const transcriber = await getTranscriber(speechToTextCallback);

      // Store the speech-to-text send and close functions in the state
      states[socket.id].transcriberSend = transcriber.send;
      states[socket.id].transcriberClose = transcriber.close;

      console.log("Finished setting up recording state for socket", socket.id);
    } else {
      // Close all streams and clear state
      states[socket.id]?.transcriberClose?.();
      states[socket.id]?.answererClose?.();
      states[socket.id]?.synthesizerClose?.();
      delete states[socket.id];
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected. Cleaning up state for socket", socket.id);
    // Close all streams and clear state
    states[socket.id]?.transcriberClose?.();
    states[socket.id]?.answererClose?.();
    states[socket.id]?.synthesizerClose?.();
    delete states[socket.id];
  });

  socket.on("audio", (audioChunk) => {
    console.log("audio", audioChunk.length);
    states[socket.id]?.transcriberSend?.(audioChunk);
  });
};
