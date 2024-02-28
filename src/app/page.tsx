"use client";

import { useCallback, useEffect, useState } from "react";
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
import useMicMp3 from "./useMicMp3";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [texts, setTexts] = useState<string[]>([]);

  const [socket, setSocket] = useState<Socket | null>(null);

  const mp3DataCallback = useCallback(
    (data: Int16Array) => {
      socket?.emit("mp3", data);
    },
    [socket]
  );

  const { isRecording, setIsRecording } = useMicMp3({ mp3DataCallback });
  useEffect(() => {
    const socket: Socket = io(window.location.origin);
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket?.on("message", (data: string) => {
      console.log("message", JSON.stringify(data));
      setTexts((texts) => [...texts, data]);
      console.log("message", data);
    });
  }, [socket]);

  const [hovered, setHovered] = useState(false);
  const toast = useToast();

  const renderIcon = () => {
    return isRecording ? hovered ? <FiMicOff /> : <FiMic /> : <FiMic />;
  };

  const handleRecord = () => {
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
  };
  const callGpt = async () => {
    console.log("call gpt");
    socket?.emit("gpt");
  };

  useEffect(() => {
    socket?.on("response", (data: string) => {
      console.log("Response", data);
    });
  }, [socket]);

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
              <Heading size={{ base: "sm", md: "md" }}>🤖 Autopilot</Heading>
              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="fg.muted"
                maxW="3xl"
              >
                Because why not send someone else to your useless meetings
              </Text>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Container maxW="3xl">
        <VStack py={{ base: "8", md: "12" }} align="center" justify="center">
          <Button onClick={callGpt}>GPT</Button>
        </VStack>
      </Container>

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
                <Text mb={2}>Recorded Text:</Text>
                {texts.map((text, index) => (
                  <Text key={index}>{text}</Text>
                ))}
              </Box>
              <Box textAlign="center">
                <Text mb={2}>Potential Response:</Text>
                <Text>(...)</Text>
              </Box>
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
}
