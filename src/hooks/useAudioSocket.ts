import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const timeSlice = 1000;

const useAudioRecorder = () => {
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

    if (isRecording) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start(timeSlice);

          mediaRecorder.ondataavailable = async (e) => {
            const arrayBuffer = await e.data.arrayBuffer();
            console.log("data available", arrayBuffer);
            socket?.emit("audio", arrayBuffer);
          };
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

export default useAudioRecorder;
