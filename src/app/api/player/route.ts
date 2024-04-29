import { createPlayer } from "@/ws/streams/player";

export const GET = async () => {
  await createPlayer({
    audioDir: "./audio",
    onPlay: (audioBase64, index, isFinal, timestamp) => {
      console.log("onPlay", timestamp);
    },
  });

  return Response.json({ status: "finished" });
};
