"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Text,
  VStack,
  useToast,
  Heading,
} from "@chakra-ui/react";
import { FiMic, FiMicOff } from "react-icons/fi";
import useMicMp3 from "./hooks/useMicMp3";
import { io, Socket } from "socket.io-client";
import useAudioPlayer from "./usePlayAudio";

type StateItem = { text: string; answer: string };
type State = Record<string, StateItem>;
const storeToState =
  ({
    count,
    field,
    value,
  }: {
    count: string;
    field: keyof StateItem;
    value: string;
  }) =>
  (state: State): State => {
    return {
      ...state,
      [count]: {
        ...(state[count] || { answer: "", text: "" }),
        [field]: (state[count]?.[field] || "") + value,
      },
    };
  };

export default function Home() {
  type State = Record<string, { text: string; answer: string }>;

  const [state, setState] = useState<State>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const onMicData = useCallback(
    (data: Int8Array) => {
      console.log("Sending audio data to ws");
      socket?.emit("audio", data);
    },
    [socket]
  );
  const handleAudioData = useAudioPlayer();

  const { isRecording, setIsRecording } = useMicMp3({ onMicData });

  useEffect(() => {
    const socket: Socket = io(window.location.origin);
    socket.on("connect", () => {
      setSocket(socket);
    });
    audioContextRef.current = new window.AudioContext();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log(
      "New socket handler",
      audioContextRef.current?.state,
      socket?.id
    );

    socket?.on(
      "message",
      ({ data, counter }: { data: string; counter: number }) => {
        setState(
          storeToState({
            count: counter.toString(),
            field: "text",
            value: data,
          })
        );
      }
    );

    socket?.on(
      "elevenlab",
      ({ data, counter }: { data: string; counter: number }) => {
        console.log("elevenlab event", counter);
        if (audioContextRef.current) {
          handleAudioData(data, audioContextRef.current);
        }
      }
    );

    socket?.on(
      "agentResponse",
      ({ data, counter }: { data: string; counter: number }) => {
        setState(
          storeToState({
            count: counter.toString(),
            field: "answer",
            value: data,
          })
        );
      }
    );
  }, [socket, handleAudioData]);

  const [hovered, setHovered] = useState(false);
  const toast = useToast();

  const renderIcon = () => {
    return isRecording ? hovered ? <FiMicOff /> : <FiMic /> : <FiMic />;
  };

  const handleRecord = async () => {
    toast({
      title: "Recording started",
      status: "info",
      duration: 3000,
      isClosable: false,
      position: "bottom",
      variant: "subtle",
      size: "sm",
      containerStyle: {
        background: "transparent",
        borderColor: "blue.500",
        color: "blue.500",
      },
    });
    setIsRecording(true);
    console.log("Recording started", audioContextRef.current?.state);
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current?.resume();
      console.log("audio context resumed", audioContextRef.current?.state);
    }

    console.log("Sending recording state change to ws");

    socket?.emit("recordingStateChange", { isRecording: true });
  };

  const handleStop = () => {
    toast({
      title: "Recording stopped",
      status: "success",
      duration: 3000,
      isClosable: false,
      variant: "subtle",
      containerStyle: {
        background: "transparent",
        borderColor: "green.500",
        color: "green.500",
      },
    });
    setIsRecording(false);
    console.log("Sending recording state change to ws");

    socket?.emit("recordingStateChange", { isRecording: false });
  };

  return (
    <>
      <Box bg="bg.surface">
        <Container py={{ base: "16", md: "24" }}>
          <Stack
            spacing={{ base: "12", md: "16" }}
            textAlign="center"
            align="center"
          >
            <Stack spacing={{ base: "4", md: "5" }}>
              <Heading size={{ base: "sm", md: "md" }}>
                👥 Superclone AI
              </Heading>
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="fg.muted"
                maxW="3xl"
              >
                Send your clone to attend your meetings
              </Text>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Container maxW="3xl">
        <VStack py={{ base: "8", md: "12" }} align="center" justify="center">
          <Button
            leftIcon={renderIcon()}
            colorScheme={isRecording ? "red" : "green"}
            onClick={isRecording ? handleStop : handleRecord}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            _hover={{
              bg: isRecording ? "red.500" : "green.500",
              transform: "scale(1.04)",
            }}
            sx={{
              animation: isRecording ? "pulse 2s infinite" : "none",
            }}
          >
            {isRecording ? "Recording..." : "Start"}
          </Button>
        </VStack>
      </Container>

      <Box as="section">
        <Container maxW="3xl">
          <Box
            bg="bg.surface"
            boxShadow="sm"
            borderRadius="lg"
            p={{ base: "4", md: "6" }}
          >
            <VStack spacing={4}>
              <Box textAlign="center">
                {Object.entries(state).map(([key, value]) => (
                  <Box key={key} mb={4}>
                    <Text mb={2}>Counter {key}</Text>
                    <Text mb={2}>Recorded Text:</Text>
                    <Text>{value.text}</Text>
                    <Text mb={2}>GPT Response:</Text>
                    <Text>{value.answer}</Text>
                  </Box>
                ))}
              </Box>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
