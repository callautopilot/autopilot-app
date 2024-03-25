import { ChatCompletionMessageParam } from "openai/resources";
import { Transcriber } from "@/ws/streams/transcriber";
import { Synthesizer } from "@/ws/streams/synthesizer";
import { Answerer } from "@/ws/streams/answerer";
import { Vocalizer } from "./streams/vocalizer";

export type State = {
  // State data
  transcript?: string;
  messages?: ChatCompletionMessageParam[];
  counter?: number;

  // Send functions for the streams
  transcriberSend?: Transcriber["send"];

  vocalizer?: Vocalizer;

  // Close functions for the streams
  synthesizerClose?: Synthesizer["close"];
  transcriberClose?: Transcriber["close"];
  answererClose?: Answerer["close"];
};

export interface ServerEvents {
  assistantSetRecording: (data: { isRecording: boolean }) => void;
  assistantOnListen: (data: { audioChunk: Int8Array }) => void;
  assistantOnTranscript: (data: {
    transcript: string;
    index: number;
    isFinal: boolean;
  }) => void;
  assistantOnAnswer: (data: {
    answer: string;
    index: number;
    isFinal: boolean;
  }) => void;
  assistantOnSynthesize: (data: { audioBase64: string; index: number }) => void;
}
