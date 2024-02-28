import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { Server, Socket } from "socket.io";
import OpenAI from "openai";
import {
  ChatCompletionChunk,
  ChatCompletionSystemMessageParam,
} from "openai/resources";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const systemMessage: ChatCompletionSystemMessageParam = {
  role: "system",
  content: `
  You are a vocal assistant that responds to user questions.
  User speech will be converted to text and sent to you as a messages.
  Sometimes the sentences will be incomplete respond nothing in this case.
  Start responding to the user when you detect a question.
    `,
};

const gpt = async (socket: Socket) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.1,
    messages: [
      systemMessage,
      { role: "user", content: "What is the capital of France?" },
    ],
    stream: true,
  });
  const reader = response.toReadableStream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const data = <ChatCompletionChunk>(
      JSON.parse(new TextDecoder("utf-8").decode(value))
    );
    const message = data.choices[0]?.delta.content;
    console.log("Response GPT", message);
    socket.emit("response", message);
  }
  console.log("GPT done");
};

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY!);

let buffers: Buffer[] = [];
const bufferMaxLength = 200;
let mp3FilesCount = 0;

export function handleMessages(io: Server, socket: Socket) {
  console.log("A user connected");

  const connection = deepgramClient.listen.live({
    punctuate: true,
    smart_format: true,
    model: "nova-2",
    language: "fr",
  });
  let isDeepgramReady = false;
  let keepAlive: NodeJS.Timeout | undefined = undefined;
  if (keepAlive) clearInterval(keepAlive);
  keepAlive = setInterval(() => {
    console.log("deepgram: keepalive");
    connection.keepAlive();
  }, 10 * 1000);

  connection.on(LiveTranscriptionEvents.Open, async () => {
    isDeepgramReady = true;
    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel.alternatives[0].transcript;
      console.log("Transcript: ", transcript);
      socket.emit("message", transcript);
    });

    connection.on(LiveTranscriptionEvents.Close, async () => {
      console.log("deepgram: disconnected");
      isDeepgramReady = false;
      clearInterval(keepAlive);
      connection.finish();
    });

    connection.on(LiveTranscriptionEvents.Error, async (error) => {
      console.log("deepgram: error received");
      console.error(error);
    });

    connection.on(LiveTranscriptionEvents.Warning, async (warning) => {
      console.log("deepgram: warning received");
      console.warn(warning);
    });

    connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.log("deepgram: packet received");
      console.log("deepgram: metadata received");
      console.log("ws: metadata sent to client");
    });
  });

  socket.on("mp3", (audio) => {
    console.log("mp3 received");
    const buffer = Buffer.from(audio);
    if (isDeepgramReady) {
      console.log("deepgram: send audio");
      connection.send(buffer);
    }
  });

  socket.on("gpt", async () => {
    console.log("gpt request received");
    await gpt(socket);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    clearInterval(keepAlive);
    connection.finish();
  });
}
