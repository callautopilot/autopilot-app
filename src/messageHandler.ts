import { toFile } from "openai/uploads";
import { Server, Socket } from "socket.io";
import OpenAI from "openai";
import { writeFileSync } from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

let buffers: Buffer[] = [];
const bufferMaxLength = 200;
let mp3FilesCount = 0;

const handleMessagesMp3 = async (audio: ArrayBuffer, io: Server) => {
  const buffer = Buffer.from(audio);
  buffers.push(buffer);

  // When the data is too long, we save it to a file
  if (buffers.length > bufferMaxLength) {
    const buffer = Buffer.concat(buffers);
    buffers = [];
    const audioFileName = `audio-${mp3FilesCount}.mp3`;
    await writeFileSync(audioFileName, buffer);
    console.log("audio saved", audioFileName);
    io.emit("message", `Audio saved ${audioFileName}`);

    mp3FilesCount++;

    /* const file = await toFile(buffer, "audio.mp3");

    await openai.audio.transcriptions
      .create({
        model: "whisper-1",
        file: file,
        //prompt: "previous segment",
        language: "fr",
        response_format: "text",
      })
      .then((response) => {
        console.log("speech to text response: ", response);
      });
 */
  }
};

export function handleMessages(io: Server, socket: Socket) {
  console.log("A user connected");

  socket.on("mp3", (audio) => handleMessagesMp3(audio, io));

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    socket.off("message", handleMessagesMp3);
  });
}
