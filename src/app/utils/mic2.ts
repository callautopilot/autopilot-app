// @ts-ignore -- No types for lamejs
import MPEGMode from "lamejs/src/js/MPEGMode";
// @ts-ignore -- No types for lamejs
import Lame from "lamejs/src/js/Lame";
// @ts-ignore -- No types for lamejs
import BitStream from "lamejs/src/js/BitStream";
// @ts-ignore -- No types for lamejs
import * as lamejs from "lamejs/src/js/";

if (typeof window !== "undefined") {
  (window as any).MPEGMode = MPEGMode;
  (window as any).Lame = Lame;
  (window as any).BitStream = BitStream;
}

const BUFF_SIZE = 2048; // 2k buffer for GUM, needs to be power of two
const CHANNELS = 1; // 1 for mono or 2 for stereo
const SAMPLE_RATE = 44100; // 44.1khz (normal mp3 samplerate)
const KILOBITS_PER_SECOND = 128; // encode 128kbps mp3
const SAMPLE_BLOCK_SIZE = 576; // can be anything but make it a multiple of 576 to make encoder's life easier
const SAMPLE_MULTIPLIER = 10 * 0x7ff; // Convert float to int16 with 10x gain

export const startMicrophone = (
  stream: MediaStream,
  audioDataCallback: (mp3: Int8Array) => void
): AudioContext => {
  const audioContext: AudioContext = new AudioContext();

  const gainNode: GainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0;

  const microphoneStream: MediaStreamAudioSourceNode =
    audioContext.createMediaStreamSource(stream);

  const scriptProcessorNode: ScriptProcessorNode =
    audioContext.createScriptProcessor(BUFF_SIZE, 1, 1);

  const processMicrophoneBuffer = createBufferProcessor(audioDataCallback);
  scriptProcessorNode.onaudioprocess = processMicrophoneBuffer;

  microphoneStream.connect(scriptProcessorNode);
  scriptProcessorNode.connect(gainNode);
  return audioContext;
};

const createBufferProcessor = (audioDataCallback: (mp3: Int8Array) => void) => {
  const mp3encoder: lamejs.Mp3Encoder = new lamejs.Mp3Encoder(
    CHANNELS,
    SAMPLE_RATE,
    KILOBITS_PER_SECOND
  );

  const processMicrophoneBuffer = (event: AudioProcessingEvent) => {
    const sample: Float32Array = event.inputBuffer.getChannelData(0);

    for (let j = 0; j < sample.length; j += SAMPLE_BLOCK_SIZE) {
      const sampleBlock: Float32Array = sample.slice(j, j + SAMPLE_BLOCK_SIZE);
      const sampleI16: Int16Array = new Int16Array(sampleBlock.length);
      for (let i = 0; i < sampleBlock.length; i++) {
        sampleI16[i] = sampleBlock[i] * SAMPLE_MULTIPLIER;
      }
      const mp3: Int8Array = mp3encoder.encodeBuffer(sampleI16);
      if (mp3.length > 0) {
        audioDataCallback(mp3);
      }
    }
  };
  return processMicrophoneBuffer;
};
