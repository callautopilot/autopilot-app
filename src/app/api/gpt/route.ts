import OpenAI from "openai";
import { OpenAIStream, OpenAIStreamCallbacks, StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET(_req: Request) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [
      {
        content: "Give me a lorem ipsum of 20 words",
        name: "Human",
        role: "assistant",
      },
    ],
  });

  const streamCallbacks: OpenAIStreamCallbacks = {
    onToken: (content) => {
      console.log("stream content: ", content);
    },
    onFinal() {
      console.log(`end of stream`);
    },
  };

  const stream = OpenAIStream(response, streamCallbacks);

  return new StreamingTextResponse(stream);
}
