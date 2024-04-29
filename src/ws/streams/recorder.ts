import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";

type Args = {
  audioDir: string;
};

type Recorder = (
  audioBase64: string | null,
  index: number,
  isFinal: boolean
) => void;

export const createRecorder = ({ audioDir }: Args): Recorder => {
  if (existsSync(audioDir)) {
    rmSync(audioDir, { recursive: true, force: true });
  }
  mkdirSync(audioDir);
  const start = Date.now();
  const recorder: Recorder = (audioBase64, index, isFinal) => {
    if (audioBase64 === null) return;
    const time = Date.now() - start;
    writeFileSync(`${audioDir}/${time}.mp3`, audioBase64, "base64");
    console.log("Saved audio file to ./audio/", time, ".mp3");
  };
  return recorder;
};
