// @ts-ignore -- No types for lamejs
import MPEGMode from "lamejs/src/js/MPEGMode";
// @ts-ignore -- No types for lamejs
import Lame from "lamejs/src/js/Lame";
// @ts-ignore -- No types for lamejs
import BitStream from "lamejs/src/js/BitStream";
// @ts-ignore -- No types for lamejs
import * as lamejs from "lamejs/src/js/";

const AUDIO_PROCESSOR = "/audioProcessor.js";
const MICROPHONE_WORKLET_PROCESSOR = "microphone-worklet-processor";
const CHANNELS = 1; // 1 for mono or 2 for stereo
const SAMPLE_RATE = 44100; // 44.1khz (normal mp3 samplerate)
const KILOBITS_PER_SECOND = 128; // encode 128kbps mp3
const SAMPLE_MULTIPLIER = 10 * 0x7ff; // Convert float to int16 with 10x gain

if (typeof window !== "undefined") {
  (window as any).MPEGMode = MPEGMode;
  (window as any).Lame = Lame;
  (window as any).BitStream = BitStream;
}

let encoder: lamejs.Mp3Encoder = new lamejs.Mp3Encoder(
  CHANNELS,
  SAMPLE_RATE,
  KILOBITS_PER_SECOND
);

export const startMicrophone = async (
  stream: MediaStream,
  audioDataCallback: (mp3: Int8Array) => void
): Promise<AudioContext> => {
  const audioContext: AudioContext = new AudioContext();

  // Load the processor
  await audioContext.audioWorklet.addModule(AUDIO_PROCESSOR);

  const gainNode: GainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0;

  const microphoneStream: MediaStreamAudioSourceNode =
    audioContext.createMediaStreamSource(stream);

  // Create an AudioWorkletNode
  const workletNode = new AudioWorkletNode(
    audioContext,
    MICROPHONE_WORKLET_PROCESSOR
  );
  workletNode.port.onmessage = (event) => {
    if (event.data && event.data.audioData) {
      // Convert the 32-bit floating point array to a 16-bit integer array
      const audioDataInt16 = Array.from(
        event.data.audioData,
        (data: number) => data * SAMPLE_MULTIPLIER
      );

      // The audio data is already a 1D array
      const mp3 = encoder.encodeBuffer(audioDataInt16);
      if (mp3.length > 0) {
        audioDataCallback(new Int8Array(mp3));
      }
    }
  };
  microphoneStream.connect(workletNode);
  workletNode.connect(gainNode);
  return audioContext;
};
