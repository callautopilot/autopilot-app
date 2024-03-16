"use client";
// Uses getUserMedia to record audio from microphone, compresses it to mp3, and throws it away.
// You should change the last step to e.g. pushing the audio to a server over a WebSocket.

// This script uses lame.js for mp3 encoding
// https://github.com/zhuker/lamejs

import MPEGMode from "lamejs/src/js/MPEGMode";
import Lame from "lamejs/src/js/Lame";
import BitStream from "lamejs/src/js/BitStream";
import * as lamejs from "lamejs/src/js/";

if (typeof window !== "undefined") {
  window.MPEGMode = MPEGMode;
  window.Lame = Lame;
  window.BitStream = BitStream;
}

var BUFF_SIZE = 2048; // 2k buffer for GUM, needs to be power of two

var channels = 1; // 1 for mono or 2 for stereo
var sampleRate = 44100; // 44.1khz (normal mp3 samplerate)
var kbps = 128; // encode 128kbps mp3

var sampleBlockSize = 576; // can be anything but make it a multiple of 576 to make encoder's life easier

export function start_microphone(stream, audioDataCallback) {
  var audioContext = new AudioContext();

  var gain_node = audioContext.createGain();
  gain_node.connect(audioContext.destination);
  gain_node.gain.value = 0;

  var microphone_stream = audioContext.createMediaStreamSource(stream);

  var script_processor_node = audioContext.createScriptProcessor(
    BUFF_SIZE,
    1,
    1
  );

  const process_microphone_buffer = factory(audioDataCallback);
  script_processor_node.onaudioprocess = process_microphone_buffer;

  microphone_stream.connect(script_processor_node);
  script_processor_node.connect(gain_node);
  return audioContext;
}

const factory = (audioDataCallback) => {
  var mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);

  const process_microphone_buffer = (event) => {
    var sample = event.inputBuffer.getChannelData(0);

    /* MP3 encode */
    for (var j = 0; j < sample.length; j += sampleBlockSize) {
      var sampleBlock = sample.slice(j, j + sampleBlockSize);
      var sampleI16 = new Int16Array(sampleBlock.length);
      for (var i = 0; i < sampleBlock.length; i++) {
        sampleI16[i] = sampleBlock[i] * 10 * 0x7ff;
      }
      var mp3 = mp3encoder.encodeBuffer(sampleI16);
      if (mp3.length > 0) {
        audioDataCallback(mp3);
      }
    }
  };
  return process_microphone_buffer;
};
