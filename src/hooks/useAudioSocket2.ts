import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MediaRecorder, register } from "extendable-media-recorder";
import { connect } from "extendable-media-recorder-wav-encoder";

const timeSlice = 1000;

const useAudioRecorder2 = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    let mediaRecorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let header: ArrayBuffer | undefined;

    const uploadWav = (blob: Blob) => {
      const arrayBuffer = blob.arrayBuffer();
      socket?.emit("audio", arrayBuffer);
    };

    if (isRecording) {
      Promise.all([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        connect().then((port) => register(port)),
      ])
        .then(([s, _]) => {
          stream = s;
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "audio/wav",
          });

          mediaRecorder.addEventListener("dataavailable", async ({ data }) => {
            if (header === undefined) {
              header = (await data.arrayBuffer()).slice(0, 44);
              uploadWav(data);
            } else {
              const content = await data.arrayBuffer();
              uploadWav(new Blob([header, content], { type: data.type }));
            }
          });

          mediaRecorder.start(timeSlice);
        })
        .catch((err) => {
          console.error(err);
        });
    }

    return () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, socket]);

  return { isRecording, setIsRecording };
};

export default useAudioRecorder2;
