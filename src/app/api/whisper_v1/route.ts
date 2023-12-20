import OpenAI from "openai";
import { toFile } from "openai/uploads.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const data = Object.fromEntries(await req.formData());
  const fileBlob = data.file as Blob;
  const arrayBuffer = await fileBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const file = await toFile(buffer, "audio.webm");

  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: file,
    //prompt: "previous segment",
    language: "fr",
    response_format: "text",
  });

  console.log("speech to text response: ", response);

  return Response.json(response);
}
