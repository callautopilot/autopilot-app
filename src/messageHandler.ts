import { toFile } from "openai/uploads";
import { Server, Socket } from "socket.io";
import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import EbmlStream from "ebml-stream";
const { EbmlStreamDecoder } = require("ebml-stream");

import { writeFileSync } from "fs";
import { buffer } from "stream/consumers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

let index = 0;

console.log("process.env.OPENAI_API_KEY!: ", process.env.OPENAI_API_KEY);

export function handleMessages(io: Server, socket: Socket) {
  console.log("A user connected");
  // Handle chat messages

  const messageListener = (message: string) => {
    console.log("Message Received: " + message);
    io.emit("message", message); // Broadcast the message to all connected clients
  };
  let data: any[] = [];
  let count = 0;

  const audioListener2 = async (audio: ArrayBuffer) => {
    const buffer = Buffer.from(audio);

    // Create a Readable stream from the audio buffer
    const stream = require("stream");
    const readable = new stream.Readable();
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(buffer);
    readable.push(null);

    // Create an EBML stream to parse the WebM data
    const es = new EbmlStreamDecoder();

    // Pipe the readable stream into the EBML stream
    readable.pipe(es);

    es.on("data", async (chunk: any) => {
      // Convert the cluster to a WAV file
      await convertWebmToAudio(chunk, `audio-${index}.wav`);
      index++;
    });
  };

  const audioListener = async (audio: ArrayBuffer) => {
    console.log("Audio Received: ");

    const buffer = Buffer.from(audio);

    // Create a Readable stream from the audio buffer
    const stream = require("stream");
    const readable = new stream.Readable();
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(buffer);
    readable.push(null);

    // Convert the 'webm' stream to 'wav' using ffmpeg
    const converter = ffmpeg(readable)
      .inputFormat("webm")
      .audioCodec("pcm_s16le")
      .format("wav");

    // Create a PassThrough stream to collect the 'wav' data
    const passThrough = new PassThrough();
    const chunks: Uint8Array[] = [];
    passThrough.on("data", (chunk: Uint8Array) => chunks.push(chunk));

    converter.output(passThrough);
    await new Promise((resolve, reject) => {
      converter.on("end", resolve);
      converter.on("error", reject);
      converter.run();
    });

    const wavBuffer = Buffer.concat(chunks);

    const file = await toFile(wavBuffer, "audio.wav");

    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
      //prompt: "previous segment",
      language: "fr",
      response_format: "text",
    });

    console.log("speech to text response: ", response);

    //io.emit("audio", audio);
  };

  const audioListenerMp3 = async (audio: ArrayBuffer) => {
    //console.log("Audio Received: ", audio);

    const buffer = Buffer.from(audio);

    data.push(buffer);

    // When the data is too long, we save it to a file
    if (data.length > 150) {
      const buffer = Buffer.concat(data);
      await writeFileSync(`audio-${count}.mp3`, buffer);
      console.log("audio.mp3 saved");
      count++;

      const file = await toFile(buffer, "audio.mp3");

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

      data = [];
    }

    // Print audio length
    //console.log("audio length: ", buffer.length);
  };

  socket.on("message", messageListener);
  socket.on("audio", audioListener2);

  socket.on("mp3", audioListenerMp3);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    socket.off("message", messageListener); // Remove the message listener
  });
}

function convertWebmToAudio(
  inputBuffer: Buffer,
  outputFilename: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = require("stream");
    const readable = new stream.Readable();
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(inputBuffer);
    readable.push(null);

    ffmpeg(readable)
      .inputFormat("webm")
      .audioCodec("pcm_s16le")
      .format("wav")
      .on("error", reject)
      .on("end", resolve)
      .save(outputFilename);
  });
}
