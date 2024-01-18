"use client";
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Socket } from "socket.io-client";

const socket = io("http://localhost:3000"); // Replace with your server URL

const Index = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const socket: Socket = io();

    // Listen for incoming messages
    socket.on("message", (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      // Disconnect the socket when the component unmounts
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    socket.emit("message", newMessage);
    setNewMessage("");
  };

  return (
    <div>
      <h1>Real-Time Chat</h1>
      <div>
        {messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Index;
