"use client";

import useAudioRecorder from "@/hooks/useAudioSocket";

export default function Audio() {
  const { isRecording, setIsRecording } = useAudioRecorder();

  return (
    <button onClick={() => setIsRecording(!isRecording)}>
      {isRecording ? "Stop Recording" : "Start Recording"}
    </button>
  );
}
