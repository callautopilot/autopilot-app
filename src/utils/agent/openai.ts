import OpenAI from "openai";
import { ExtendedSocket } from "../types";
import { ChatCompletionMessageParam } from "openai/resources";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const initializeAgent = (socket: ExtendedSocket): void => {
  socket.conversationHistory = [{
    role: "system",
    content: `You are a helpful vocal assistant that responds to user questions.
Never say "How can I help you today" or anything alike, this is useless in this case.
User speech will be converted to text and sent to you as a messages.
Sometimes the sentences will be incomplete respond NOTHING in this case, en empty text response.
Start responding to the user when you detect a question.`,
  }];
  socket.gptReady = true;
  socket.transcriptBuffer = '';
};

export const sendToGpt = async (transcriptBuffer: string, socket: ExtendedSocket): Promise<void> => {
  socket.gptReady = false;

  // Exit the function if conversationHistory is undefined
  if (!socket.conversationHistory) {
    console.error("conversationHistory is undefined");
    return;
  }

  socket.conversationHistory.push({ role: "user", content: transcriptBuffer });

  const messages: ChatCompletionMessageParam[] = socket.conversationHistory.map(msg => ({
    // Explicitly type the role
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      messages: messages,
      max_tokens: 100,
    });
    
    const agentResponse = response.choices[0].message?.content;

    console.log("Agent response:", agentResponse);
    socket.emit("agentResponse", agentResponse);

    // Optionally, update conversation history with GPT's response
    if (agentResponse) {
        socket.conversationHistory!.push({
        role: "assistant",
        content: agentResponse
      });
    }
  } catch (error) {
    console.error("Error in GPT communication:", error);
  } finally {
    // Mark GPT as ready again
    socket.gptReady = true;
  }
};
