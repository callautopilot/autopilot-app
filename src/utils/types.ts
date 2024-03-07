import { DeepgramClient } from "@deepgram/sdk";
import { Socket } from "socket.io";

export interface ExtendedSocket extends Socket {
  transcriptBuffer?: string;
  deepgramConnection?: ReturnType<DeepgramClient['listen']['live']>;
  deepgramReady?: boolean;
  conversationHistory?: { role: string; content: string }[];
  gptReady?: boolean;
}