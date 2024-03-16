import { getSynthesizer } from "@/ws/streams/synthesizer";
import { getTranscriber } from "@/ws/streams/transcriber";
import { getAnswerer, initialMessage } from "@/ws/streams/answerer";

export type Vocalizer = {
  close: () => void;
  send: (audioChunk: any) => void;
};

type Args = {
  onTranscript: (transcript: string) => void;
  onAnswer: (answer: string) => void;
  onSynthesize: (audioBase64: string) => void;
};

export const createVocalizer = async ({
  onTranscript,
  onAnswer,
  onSynthesize,
}: Args): Promise<Vocalizer> => {
  // TODO: put that into the answerer
  let messages = [initialMessage];

  const synthesizer = await getSynthesizer(onSynthesize);

  const answerer = getAnswerer(messages, (text) => {
    synthesizer.send(text);
    onAnswer(text);
  });

  const transcriber = await getTranscriber((transcript) => {
    messages.push({ role: "user", content: transcript });
    answerer.response.then((response) => {
      messages.push({ role: "assistant", content: response });
    });
    onTranscript(transcript);
  });

  return {
    close: () => {
      transcriber.close();
      answerer.close();
      synthesizer.close();
    },
    send: transcriber.send,
  };
};
