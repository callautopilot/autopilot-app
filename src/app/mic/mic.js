"use client";
// Uses getUserMedia to record audio from microphone, compresses it to mp3, and throws it away.
// You should change the last step to e.g. pushing the audio to a server over a WebSocket.

// This script uses lame.js for mp3 encoding
// https://github.com/zhuker/lamejs

import MPEGMode from "lamejs/src/js/MPEGMode";
import Lame from "lamejs/src/js/Lame";
import BitStream from "lamejs/src/js/BitStream";
import * as lamejs from "lamejs/src/js/";

export function mic(audioDataCallback) {
  if (typeof window !== "undefined") {
    window.MPEGMode = MPEGMode;
    window.Lame = Lame;
    window.BitStream = BitStream;
  }

  /* var audioDataCallback = function (encodedData, originalData) {
    console.log(
      "Encoded " +
        encodedData.byteLength +
        " bytes. Original: " +
        originalData.byteLength
    );
  }; */

  var channels = 1; // 1 for mono or 2 for stereo
  var sampleRate = 44100; // 44.1khz (normal mp3 samplerate)
  var kbps = 128; // encode 128kbps mp3
  var mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);

  var BUFF_SIZE = 2048; // 2k buffer for GUM, needs to be power of two

  var samples = new Int16Array(BUFF_SIZE);
  var sampleBlockSize = 576; // can be anything but make it a multiple of 576 to make encoder's life easier

  var audioContext = new AudioContext();

  if (!navigator.getUserMedia) {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
  }

  if (navigator.getUserMedia) {
    navigator.getUserMedia(
      {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      },
      function (stream) {
        start_microphone(stream);
      },
      function (e) {
        console.log("Error capturing audio.", e);
      }
    );
  } else {
    console.log("getUserMedia not supported in this browser.");
  }

  function start_microphone(stream) {
    console.log("mic started");

    var gain_node = audioContext.createGain();
    gain_node.connect(audioContext.destination);
    gain_node.gain.value = 0;

    var microphone_stream = audioContext.createMediaStreamSource(stream);

    var script_processor_node = audioContext.createScriptProcessor(
      BUFF_SIZE,
      1,
      1
    );
    script_processor_node.onaudioprocess = process_microphone_buffer;

    microphone_stream.connect(script_processor_node);
    script_processor_node.connect(gain_node);
  }

  var sampleI16 = new Int16Array(BUFF_SIZE);
  function process_microphone_buffer(event) {
    var sample = event.inputBuffer.getChannelData(0);

    /* Send raw data
    for (var j = 0; j < sample.length; j++) {
        sampleI16[j] = sample[j] * 10 * 0x7FF;
    }
    audioDataCallback(sampleI16, sampleI16);
    */

    /* MP3 encode */
    for (var j = 0; j < sample.length; j += sampleBlockSize) {
      var sampleBlock = sample.slice(j, j + sampleBlockSize);
      var sampleI16 = new Int16Array(sampleBlock.length);
      for (var i = 0; i < sampleBlock.length; i++) {
        sampleI16[i] = sampleBlock[i] * 10 * 0x7ff; // Convert float to int16 with 10x gain
      }
      var mp3 = mp3encoder.encodeBuffer(sampleI16);
      if (mp3.length > 0) {
        audioDataCallback(mp3, sampleI16);
      }
    }
  }
}
