"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import useMicMp3 from "./useMicMp3";

const Index = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const mp3DataCallback = (data: Int16Array) => {
    socket?.emit("mp3", data);
  };

  const { isRecording, setIsRecording } = useMicMp3({ mp3DataCallback });
  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket?.on("message", (data) => {
      console.log("message", data);
    });
  }, [socket]);

  return (
    <button onClick={() => setIsRecording(!isRecording)}>
      {isRecording ? "Stop Recording" : "Start Recording"}
    </button>
  );
};

export default Index;
