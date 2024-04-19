import WebSocket from "ws";
import { getEnvVars } from "@/ws/runtimeEnv";

// TODO: look at this to send only phrase that are...
// https://elevenlabs.io/docs/api-reference/websockets#example-of-voice-streaming-using-elevenlabs-and-openai

export type Synthesizer = {
  send: (text: string) => void;
  close: () => void;
};

export const getSynthesizer = (
  socketId: string,
  callback: (audioBase64: string | null, isFinal: boolean) => void
): Promise<Synthesizer> => {
  const env = getEnvVars(socketId);
  
  // English
  const voiceId = env.ELEVEN_LABS_VOICE_ID;
  const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_monolingual_v1&optimize_streaming_latency=4`;

  // French
  //const voiceId = "YAFYzP1yuDhD16OgDIhV"; // GUS
  //const voiceId = "EjtTWI2Y9BBilPwnIBhg";
  //const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2&optimize_streaming_latency=4`;

  return new Promise<Synthesizer>((resolve, reject) => {
    const ws = new WebSocket(uri);

    const send = (text: string) => {
      console.log("Sending text", text);
      ws.send(
        JSON.stringify({
          text,
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          xi_api_key: env.ELEVEN_LABS_API_KEY,
          try_trigger_generation: true,
        })
      );
    };

    const close = () => {
      send("");
    };

    ws.on("message", (rawData) => {
      const data = JSON.parse(rawData.toString());
      // Emit the data to the client
      const audioBase64 = data["audio"] as string | null;
      const isFinal = !!data["isFinal"];
      callback(audioBase64, isFinal);

      if (!!data["isFinal"]) {
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
