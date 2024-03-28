import { env } from "@/utils/env";
import {
  createClient,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";

export type Transcriber = {
  send: (audioChunk: any) => void;
  close: () => void;
};

export const getTranscriber = (
  callback: (transcript: string) => void
): Promise<Transcriber> => {
  return new Promise((resolve, reject) => {
    const client = createClient(env.DEEPGRAM_API_KEY).listen.live({
      punctuate: true,
      smart_format: true,
      model: "nova-2",
      //language: "fr",
      language: "en",
    });

    let keepAliveInterval: NodeJS.Timeout;

    client.on("open", () => {
      keepAliveInterval = setInterval(() => {
        if (client) {
          client.keepAlive();
        }
      }, 10000);

      const close = () => {
        if (client) {
          client.finish();
        }
      };

      const send = (audioChunk: any) => {
        if (client) {
          const buffer = Buffer.from(audioChunk);
          client.send(buffer);
        }
      };

      resolve({ send, close });
    });

    client.on(
      LiveTranscriptionEvents.Transcript,
      (event: LiveTranscriptionEvent) => {
        const transcript = event.channel.alternatives[0].transcript;
        if (!transcript || transcript === "") return;
        callback(" " + transcript);
      }
    );

    client.on("close", () => {
      clearInterval(keepAliveInterval);
    });

    client.on("error", (error) => {
      console.error("Deepgram error for socket ID", error);
      reject(error);
    });
  });
};
