import { Synthesizer, getSynthesizer } from "@/ws/streams/synthesizer";
import { getTranscriber } from "@/ws/streams/transcriber";
import { Answerer, getAnswerer, initialMessage } from "@/ws/streams/answerer";
import { debounce } from "lodash";

export type Vocalizer = {
  close: () => void;
  send: (audioChunk: any) => void;
};

type Args = {
  socketId: string,
  onTranscript: (transcript: string, index: number, isFinal: boolean) => void;
  onAnswer: (answer: string, index: number, isFinal: boolean) => void;
  onSynthesize: (
    audioBase64: string | null,
    index: number,
    isFinal: boolean
  ) => void;
};

export const createVocalizer = async ({
  socketId,
  onTranscript,
  onAnswer,
  onSynthesize,
}: Args): Promise<Vocalizer> => {
  // Local variables
  let messages = [initialMessage];
  let transcriptToProcess = "";
  let index = 0;
  let answererClose: Answerer["close"];
  let synthesizerClose: Synthesizer["close"];

  const transcriptHandler = debounce(async () => {
    // Set the transcript as final
    onTranscript("", index, true);

    // Extract the local transcript to process
    const transcript = transcriptToProcess;

    // Clear the local transcript to process
    transcriptToProcess = "";

    // Extract the local index
    const currentIndex = index;

    // Increment the local index
    index += 1;

    // Initiate the next transcript as loading
    onTranscript("", index, false);

    // Create a new synthesizer
    const synthesizer = await getSynthesizer(socketId, (audioBase64, isFinal) => {
      // Call the onSynthesize callback using the current index
      console.log("onSynthesize", currentIndex, isFinal);
      onSynthesize(audioBase64, currentIndex, isFinal);
    });

    // Store the synthesizer close function in the local variables
    synthesizerClose = synthesizer.close;

    // Add a new user message to local messages
    messages.push({ role: "user", content: transcript });

    // Create a new answerer
    const answerer = getAnswerer(socketId, messages, (text: string) => {
      // Send the answer chunk to the synthesizer unless it is empty (because it will close the synthesizer)
      if (text != "") {
        // Ensure text ends with a space (to avoid cutting off the last word)
        const text_with_trailling_space = text.trim() + " ";
        synthesizer.send(text_with_trailling_space);
      }
      // Call the onAnswer callback using the current index
      onAnswer(text, currentIndex, false);
    });

    // Store the answerer close function in the local variables
    answererClose = answerer.close;

    // Wait for the answerer response to finish
    await answerer.response.then((response) => {
      // Mark the answerer response as final
      onAnswer("", currentIndex, true);

      // Tell the synthesizer to close
      synthesizer.close();

      // Store the answerer final response as an assistant response in local messages
      messages.push({ role: "assistant", content: response });
    });
  }, 2000);

  const transcriber = await getTranscriber(socketId, (transcript) => {
    // Add to the local transcript to process
    transcriptToProcess += transcript;

    // Pass to the onTranscript callback using the current index
    onTranscript(transcript, index, false);

    // Call the transcript handler
    transcriptHandler();
  });

  return {
    close: () => {
      transcriber.close();
      answererClose();
      synthesizerClose();
    },
    send: transcriber.send,
  };
};
