import { useEffect, useState } from "react";
import { start_microphone } from "./mic";

type Props = { mp3DataCallback: any };

const useMicMp3 = ({ mp3DataCallback }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording && !audioContext && !stream) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        .then((s) => {
          const aC = start_microphone(s, mp3DataCallback);
          setAudioContext(aC);
          setStream(s);
          console.log("mic started");
        });
    } else if (!isRecording && (audioContext || stream)) {
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
      stream?.getTracks().forEach((track) => track.stop());
    }

    return () => {
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [isRecording, mp3DataCallback, audioContext, stream]);

  return { isRecording, setIsRecording };
};

export default useMicMp3;
