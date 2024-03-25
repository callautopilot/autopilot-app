import { useEffect, useState } from "react";
import { startMicrophone } from "@/app/utils/micMp3";

type Props = { onMicData: (mp3Data: Int8Array) => void };

const useMicMp3 = ({ onMicData }: Props) => {
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
        .then(async (s) => {
          const aC = await startMicrophone(s, onMicData);
          setAudioContext(aC);
          setStream(s);
          console.log("mic started");
        });
    } else if (!isRecording && (audioContext || stream)) {
      if (audioContext && audioContext.state !== "closed") {
        console.log("mic stopped");
        audioContext.close();
        setAudioContext(null);
      }
      stream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    return () => {
      if (audioContext && audioContext.state !== "closed") {
        console.log("mic stopped");
        audioContext.close();
        setAudioContext(null);
      }
      stream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- To prevent infinite loop
  }, [isRecording, onMicData]);

  return { isRecording, setIsRecording };
};

export default useMicMp3;
