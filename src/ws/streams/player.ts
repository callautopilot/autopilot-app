import { readFileSync, readdirSync } from "fs";
import { join } from "path";

type Args = {
  audioDir: string;
  onPlay: (
    audioBase64: string | null,
    index: number,
    isFinal: boolean,
    timestamp: number
  ) => void;
};

export const createPlayer = async ({
  audioDir,
  onPlay,
}: Args): Promise<void> => {
  const filenames = readdirSync(audioDir);
  const files = filenames
    .filter((filename) => filename.endsWith(".mp3"))
    .map((filename) => {
      const timestamp = parseInt(filename.split(".")[0], 10);
      return { filename, timestamp };
    });
  files.sort((a, b) => a.timestamp - b.timestamp);

  let previousTimestamp = files[0].timestamp;
  for (const file of files) {
    const delay = file.timestamp - previousTimestamp;
    const audioBase64 = readFileSync(join(audioDir, file.filename), "base64");
    await new Promise((resolve) => setTimeout(resolve, delay));
    const isFinal = files.indexOf(file) === files.length - 1;
    onPlay(audioBase64, 0, isFinal, file.timestamp - files[0].timestamp);
    previousTimestamp = file.timestamp;
  }
};
