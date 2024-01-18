"use client";
import { mic } from "./mic";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  const audioDataCallback = (
    encodedData: Int16Array,
    originalData: Int16Array
  ) => {
    console.log(
      "Encoded " +
        encodedData.byteLength +
        " bytes. Original: " +
        originalData.byteLength
    );
    socket?.emit("mp3", encodedData);
  };

  const sendMessage = () => {
    mic(audioDataCallback);
    console.log("send message");
  };

  return (
    <div>
      <button onClick={sendMessage}>Start</button>
    </div>
  );
};

export default Index;
