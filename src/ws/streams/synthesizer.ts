import { env } from "@/utils/env";
import WebSocket from "ws";

// TODO: look at this to send only phrase that are...
// https://elevenlabs.io/docs/api-reference/websockets#example-of-voice-streaming-using-elevenlabs-and-openai

export type Synthesizer = {
  send: (text: string, flush?: boolean) => void;
  close: () => void;
};

export const getSynthesizer = (
  callback: (audioBase64: string) => void
): Promise<Synthesizer> => {
  // English
  const voiceId = "pNInz6obpgDQGcFmaJgB";
  const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_monolingual_v1&optimize_streaming_latency=4`;

  // French
  //const voiceId = "YAFYzP1yuDhD16OgDIhV"; // GUS
  //const voiceId = "EjtTWI2Y9BBilPwnIBhg";
  //const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2&optimize_streaming_latency=4`;

  return new Promise<Synthesizer>((resolve, reject) => {
    const ws = new WebSocket(uri);

    const send = (text: string, flush: boolean = false) => {
      console.log("Sending text to ElevenLabs:", text);
      ws.send(
        JSON.stringify({
          text,
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          xi_api_key: env.ELEVEN_LABS_API_KEY,
          flush,
          try_trigger_generation: true,
        })
      );
    };

    const close = () => {
      send(" ", true);
      send("");
    };

    ws.on("message", (rawData) => {
      //console.log("Received data from ElevenLabs");
      const data = JSON.parse(rawData.toString());

      // Emit the data to the client
      if ("audio" in data && data["audio"]) {
        //console.log("Emitting audio to client");
        callback(data["audio"]);
      }
      if ("isFinal" in data && data["isFinal"]) {
        //console.log("Closing ElevenLabs connection");
        ws.close();
      }
    });

    ws.on("open", () => {
      // Send an initial space message to start the stream
      send(" ");
      resolve({ send, close });
    });
  });
};
