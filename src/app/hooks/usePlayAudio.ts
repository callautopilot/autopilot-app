import { useCallback, useRef } from "react";

type AudioQueue = {
  audioBufferPromise: Promise<AudioBuffer | null>;
  index: number;
  isFinal: boolean;
}[];

type Args = {
  onAudioEnded: ({
    index,
    isFinal,
  }: {
    index: number;
    isFinal: boolean;
  }) => void;
  jumpToNextIndexIfAvailable: boolean;
};

const useAudioPlayer = ({ onAudioEnded, jumpToNextIndexIfAvailable }: Args) => {
  const audioQueue = useRef<AudioQueue>([]);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentIndexRef = useRef<number>(null);

  const playNextAudio = useCallback(
    async (audioContext: AudioContext) => {
      console.log("playNextAudio");
      // If there is no audio in the queue or there is already an audio playing, return
      if (audioQueue.current.length === 0 || sourceRef.current) {
        return;
      }

      const nextAudioElem = audioQueue.current.shift();
      if (nextAudioElem && audioContext) {
        const audioBuffer = await nextAudioElem.audioBufferPromise;

        // If the audio buffer is null, then the audio is final
        if (audioBuffer === null) {
          sourceRef.current = null;
          onAudioEnded({
            index: nextAudioElem.index,
            isFinal: nextAudioElem.isFinal,
          });
          return;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        currentIndexRef.current = nextAudioElem.index;
        source.start();
        source.onended = () => {
          sourceRef.current = null;
          onAudioEnded({
            index: nextAudioElem.index,
            isFinal: nextAudioElem.isFinal,
          });
          // Play the next audio if there is one
          if (audioQueue.current.length > 0) {
            playNextAudio(audioContext);
          }
        };
        sourceRef.current = source;
      }
    },
    [onAudioEnded]
  );

  const handleAudioData = useCallback(
    async (
      audioBase64: string | null,
      audioContext: AudioContext,
      index: number,
      isFinal: boolean
    ) => {
      // Ignore the audio if the index is less than the current index
      if (currentIndexRef.current != null && index < currentIndexRef.current) {
        return;
      }

      const audioBufferPromise = dataToAudioBufferPromise(
        audioBase64,
        audioContext
      );
      audioQueue.current.push({ audioBufferPromise, index, isFinal });

      const isNextIndex =
        currentIndexRef.current != null && currentIndexRef.current !== index;

      // If jumpToNextIndexIfAvailable is true and the next index is available
      if (jumpToNextIndexIfAvailable && isNextIndex) {
        // Clear the queue elements that are below the next index
        audioQueue.current = audioQueue.current.filter(
          (audioElem) => audioElem.index >= index
        );
        // Stop the current audio if it is playing
        if (sourceRef.current !== null) {
          // Clear the source onEnded callback to handle it manually
          sourceRef.current.onended = null;
          sourceRef.current.stop();
          sourceRef.current = null;
          onAudioEnded({
            index: currentIndexRef.current,
            isFinal: true,
          });
        }
      }
      // If the audio is not playing, play the next audio
      if (!sourceRef.current !== null) {
        playNextAudio(audioContext);
      }
    },
    [playNextAudio, jumpToNextIndexIfAvailable, onAudioEnded]
  );

  return handleAudioData;
};

export default useAudioPlayer;

// Helper function to convert data to audio buffer
const dataToAudioBufferPromise = async (
  audioBase64: string | null,
  audioContext: AudioContext
) => {
  if (!audioBase64) {
    return Promise.resolve(null);
  }
  const byteCharacters = atob(audioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "audio/mpeg" });
  const arrayBuffer = await blob.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
};
