"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useMicMp3 from "./hooks/useMicMp3";
import { io, Socket } from "socket.io-client";
import useAudioPlayer from "./hooks/usePlayAudio";
import { Skeleton } from "@/components/ui/skeleton";
import { HeadphonesIcon, MicIcon, MicOffIcon, PencilIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyForm from "@/components/ApiKeyForm";

import { ServerEvents } from "@/ws/types";
import useAssistantState from "./hooks/useAssistantState";
import useClientEnv from "./hooks/useClientEnv";

type ClientEvents = {
  connect: () => void;
  disconnect: () => void;
} & ServerEvents;

export default function Home() {
  const { state, onTranscriptData, onAnswerData, setAudioIsFinal, clearState } =
    useAssistantState();
  const [envVars] = useClientEnv();

  // Toggle the env form visibility
  const toggleForm = () => setShowForm(!showForm);
  const [showForm, setShowForm] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const [socket, setSocket] = useState<Socket<ClientEvents> | null>(null);

  const onMicData = useCallback(
    (audioChunk: Int8Array) => {
      socket?.emit("assistantOnListen", { audioChunk });
    },
    [socket]
  );

  // Send client-side env vars
  useEffect(() => {
    if (socket && envVars) {
      socket.emit("envVars", envVars);
    }
  }, [socket, envVars]);

  const onAudioEnded = useCallback(
    ({ index, isFinal }: { index: number; isFinal: boolean }) => {
      console.log("onAudioEnded", index, isFinal);
      setAudioIsFinal(index, isFinal);
    },
    [setAudioIsFinal]
  );

  const handleAudioData = useAudioPlayer({
    onAudioEnded,
  });

  const { isRecording, setIsRecording } = useMicMp3({ onMicData });

  useEffect(() => {
    const socket: Socket<ClientEvents> = io(window.location.origin);
    socket.on("connect", () => {
      setSocket(socket);
    });
    audioContextRef.current = new window.AudioContext();
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket?.on("assistantOnTranscript", onTranscriptData);

    socket?.on("assistantOnSynthesize", ({ audioBase64, index, isFinal }) => {
      if (audioContextRef.current) {
        handleAudioData(audioBase64, audioContextRef.current, index, isFinal);
      }
    });

    socket?.on("assistantOnAnswer", ({ answer, index, isFinal }) => {
      console.log("assistantOnAnswer", answer, index, isFinal);
      onAnswerData({ answer, index, isFinal });
    });
  }, [socket, handleAudioData, onAnswerData, onTranscriptData]);

  const handleRecord = async () => {
    clearState();
    setIsRecording(true);
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current?.resume();
    }
    socket?.emit("assistantSetRecording", { isRecording: true });
  };

  const handleStop = () => {
    setIsRecording(false);
    socket?.emit("assistantSetRecording", { isRecording: false });
  };

  return (
    <div className="p-8">
      <button
        onMouseEnter={(e) => e.currentTarget.classList.replace('bg-blue-500', 'bg-blue-600')}
        onMouseLeave={(e) => e.currentTarget.classList.replace('bg-blue-600', 'bg-blue-500')}
        onClick={toggleForm}
        className="flex items-center font-medium justify-start bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded shadow-lg mb-4 transition-colors duration-200 ease-in-out"
      >
        <Settings className="mr-2 h-6 w-6" />
        <span>{showForm ? 'Hide API Keys Form' : 'Set API Keys'}</span>
      </button>

      <main className="flex items-center my-4">
        {showForm && (
          <div className="p-4 border rounded shadow-2xl w-full max-w-md">
            <ApiKeyForm />
          </div>
        )}
      </main>

      <div className="p-4 border rounded shadow-2xl">
        <RecordButton
          isRecording={isRecording}
          start={handleRecord}
          stop={handleStop}
        />
        <div className="pl-4 pt-4">
          
          <div className="text-xl font-bold pb-2">Conversation</div>
          <div className="space-y-2">
            {Object.entries(state).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <TextLine
                  text={value.transcript}
                  speaker="You"
                  isLoading={value.transcriptIsLoading}
                >
                  <MicIcon className="text-red-500 pt-[6px]" />
                </TextLine>
                <TextLine
                  text={value.answer}
                  speaker="AI"
                  isLoading={value.answerIsLoading || value.audioIsLoading}
                >
                  {value.audioIsLoading ? (
                    <HeadphonesIcon className="black" />
                  ) : (
                    <PencilIcon className="black" />
                  )}
                </TextLine>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const RecordButton = ({
  isRecording,
  start,
  stop,
}: {
  isRecording: boolean;
  start: () => void;
  stop: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const text = isRecording
    ? isHovered
      ? "Click to stop"
      : "Recording..."
    : isHovered
    ? "Click to start"
    : "Click to start";

  const IconComponent = isRecording
    ? isHovered
      ? MicOffIcon
      : MicIcon
    : isHovered
    ? MicIcon
    : MicOffIcon;

  const color = isRecording ? "text-red-500" : "text-black";

  return (
    <Button
      variant={"ghost"}
      className="font-medium justify-start"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isRecording ? stop : start}
    >
      <IconComponent className={`mr-2 h-6 w-6 ${color}`} />
      <div className={`${color}`}>{text}</div>
    </Button>
  );
};

const TextLine = ({
  text,
  speaker,
  isLoading,
  children,
}: {
  text?: string;
  speaker: string;
  isLoading: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-row text-sm space-x-2 items-start">
    <div
      className={`w-4 h-4 flex items-center justify-center ${
        isLoading ? "" : "invisible"
      }`}
    >
      {children}
    </div>

    <div className="w-[35px] flex-shrink-0 text-right">{`${speaker}:`}</div>
    {text || text !== "" ? (
      <div className="font-medium">{text}</div>
    ) : (
      <Skeleton className="h-[20px] w-full" />
    )}
  </div>
);
