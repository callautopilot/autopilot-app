import { useEffect, useRef, useState } from "react";

type Args = {
  slice_ms: number;
};

const useWhisperV1 = ({ slice_ms }: Args) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [texts, setTexts] = useState<string[]>([]);

  const isRecordingRef = useRef(isRecording);
  const stream = useRef<MediaStream>();
  const mediaRecorder = useRef<MediaRecorder>();

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    initializeDevice().then((_stream) => {
      stream.current = _stream;
      setPermissionGranted(!!_stream);
    });
  }, []);

  const recordChunk = () => {
    if (!stream.current) {
      throw new Error("Stream not initialized");
    }

    const chunks: Blob[] = [];

    mediaRecorder.current = new MediaRecorder(stream.current);

    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.current.onstop = async () => {
      const file = new File(chunks, "audio.webm");
      mediaRecorder.current = undefined;
      const text = await sendData(file);
      setTexts((texts) => [...texts, text.trim()]);
    };
    mediaRecorder.current?.start();
  };

  const record = () => {
    setIsRecording(true);
    recordChunk();

    setTimeout(() => {
      mediaRecorder.current?.stop();
      if (isRecordingRef.current) {
        record();
      }
    }, slice_ms);
  };

  const stop = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  return {
    record,
    stop,
    texts,
    isRecording,
    permissionGranted,
  };
};

const sendData = async (file: Blob) => {
  let formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/whisper_v1", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  const text = await response.json();
  return text.replaceAll("\n", "").replaceAll('"', "");
};

const initializeDevice = async () => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

export default useWhisperV1;
