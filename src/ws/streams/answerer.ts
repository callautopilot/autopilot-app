import { env } from "@/utils/env";
import OpenAI from "openai";
import {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources";

export type Answerer = {
  response: Promise<string>;
  close: () => void;
};

export const getAnswerer = (
  messages: ChatCompletionMessageParam[],
  callback: (text: string) => void
): Answerer => {
  const controller = new AbortController();
  const signal = controller.signal;
  console.log("messages", messages);
  const response = new Promise<string>(async (resolve) => {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY! });

    const response = await openai.chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        temperature: 0.5,
        messages,
        max_tokens: 100,
        stream: true,
      },
      { signal }
    );

    const reader = response.toReadableStream().getReader();
    const contents: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        resolve(contents.join(""));
        break;
      }
      const data = <ChatCompletionChunk>(
        JSON.parse(new TextDecoder("utf-8").decode(value))
      );
      const content = data.choices[0]?.delta.content;
      if (!content || content === "") continue;
      contents.push(content);
      callback(content);
    }
  });

  const close = () => {
    controller.abort();
  };

  return { response, close };
};

export const initialMessage: ChatCompletionMessageParam = {
  role: "system",
  content: `
        You are a helpful vocal assistant that responds to user questions.
        User speech is streamed to an speech-to-text API and then sent to you as messages.
        User messages might be incomplete, you might need to wait for further messages to understand the user's intent.
        Always respond in English.
        `,
};
//        Only respond to the user when you detect a question.
//         If you can't understand the user's intent, you should return an empty response, the next message might help you understand the user's intent.
//        Always respond to the user in the same language as the user's message.
