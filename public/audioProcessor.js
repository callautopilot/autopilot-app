class MicrophoneWorkletProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    for (let i = 0; i < input[0].length; ++i) {
      output[0][i] = input[0][i];
    }

    for (let channel = 0; channel < input.length; ++channel) {
      for (let i = 0; i < input[channel].length; ++i) {
        output[channel][i] = input[channel][i];
      }
    }

    // Flatten the 2D array into a 1D array
    const flattenedAudioData = output[0].reduce(
      (acc, val) => acc.concat(val),
      []
    );

    this.port.postMessage({ audioData: flattenedAudioData });

    return true;
  }
}

registerProcessor("microphone-worklet-processor", MicrophoneWorkletProcessor);
