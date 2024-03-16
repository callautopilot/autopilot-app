import { useCallback, useRef } from "react";

const useAudioPlayer = () => {
  const audioBufferPromiseQueue = useRef<Promise<AudioBuffer>[]>([]);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const counterRef = useRef(0);

  const playNextAudio = useCallback(async (audioContext: AudioContext) => {
    if (audioBufferPromiseQueue.current.length === 0 || isPlayingRef.current)
      return;
    isPlayingRef.current = true;
    const audioBufferPromise = audioBufferPromiseQueue.current.shift();

    if (audioBufferPromise && audioContext) {
      const audioBuffer = await audioBufferPromise;
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

      source.onended = () => {
        isPlayingRef.current = false;
        if (audioBufferPromiseQueue.current.length > 0) {
          playNextAudio(audioContext);
        }
      };

      sourceRef.current = source;
    }
  }, []);

  const handleAudioData = useCallback(
    async (data: string, audioContext: AudioContext) => {
      const audioBufferPromise = dataToAudioBufferPromise(data, audioContext);
      counterRef.current++;
      audioBufferPromiseQueue.current.push(audioBufferPromise);

      if (!isPlayingRef.current) {
        playNextAudio(audioContext);
      }
    },
    [playNextAudio]
  );

  return handleAudioData;
};

export default useAudioPlayer;

// Helper function to convert data to audio buffer
const dataToAudioBufferPromise = async (
  data: string,
  audioContext: AudioContext
) => {
  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "audio/mpeg" });
  const arrayBuffer = await blob.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
};
