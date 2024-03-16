import { ChatCompletionMessageParam } from "openai/resources";
import { Transcriber } from "@/ws/streams/transcriber";
import { Synthesizer } from "@/ws/streams/synthesizer";
import { Answerer } from "@/ws/streams/answerer";

export type State = {
  // State data
  transcript: string;
  messages: ChatCompletionMessageParam[];
  counter: number;

  // Send functions for the streams
  transcriberSend?: Transcriber["send"];

  // Close functions for the streams
  synthesizerClose?: Synthesizer["close"];
  transcriberClose?: Transcriber["close"];
  answererClose?: Answerer["close"];
};
