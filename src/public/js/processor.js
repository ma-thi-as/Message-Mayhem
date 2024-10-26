class MyProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // Check if input and output channels are available
    if (input && input.length > 0 && input[0] && output && output.length > 0 && output[0]) {
      // Simple pass-through processing
      for (let i = 0; i < output[0].length; i++) {
        output[0][i] = input[0][i];
      }
    }

    return true; // Keep processor alive
  }
}

// Register the processor with a unique name
registerProcessor('my-processor', MyProcessor);

