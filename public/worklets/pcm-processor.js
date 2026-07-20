/**
 * PCMProcessor - AudioWorkletProcessor
 * 
 * Captures Float32 audio samples from the microphone, maintains a 500ms rolling buffer 
 * (8000 samples at 16kHz), converts to signed PCM16, and posts chunks to the main thread 
 * with a 25% overlap for temporal continuity.
 * 
 * Designed to be production-safe, memory-efficient, and leak-free.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Maintain rolling buffer:
    // sample rate = 16000, window = 500ms, buffer size = 8000 samples
    this.bufferSize = 8000;
    
    // No overlap for main-thread buffer concatenation continuity
    this.overlapSize = 0;
    
    // Internal buffer for Float32 accumulation
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // Handle empty inputs safely
    if (!input || input.length === 0 || !input[0]) {
      // Keep processor alive even if temporarily no input
      return true;
    }

    // Input samples are Float32Array
    const channelData = input[0];
    
    for (let i = 0; i < channelData.length; i++) {
      // Append incoming chunks to internal buffer
      this.buffer[this.bufferIndex++] = channelData[i];

      // When buffer reaches 8000 samples
      if (this.bufferIndex >= this.bufferSize) {
        this._processAndPostBuffer();
      }
    }

    // Return true from process() to keep the AudioWorklet running
    return true; 
  }

  /**
   * Internal routine:
   * Converts the filled Float32 buffer to PCM16, sends to main thread,
   * and manages the 25% overlap for the next cycle.
   */
  _processAndPostBuffer() {
    // We allocate a new Int16Array here because structural cloning in postMessage 
    // requires a clean buffer that won't be mutated by the next frame.
    const pcm16Buffer = new Int16Array(this.bufferSize);
    
    for (let i = 0; i < this.bufferSize; i++) {
      let sample = this.buffer[i];
      
      // Clamp safely
      sample = Math.max(-1, Math.min(1, sample));
      
      // Convert Float32 [-1,1] to signed PCM16
      pcm16Buffer[i] = sample > 0 ? sample * 32767 : sample * 32768;
    }

    // Send to main thread.
    // Transfer the underlying ArrayBuffer for zero-copy and Safari compatibility.
    // Using transfer avoids "Message data must be a dictionary" on Safari AudioWorklet.
    this.port.postMessage(
      { type: "pcm-chunk", payload: pcm16Buffer },
      [pcm16Buffer.buffer]
    );

    // After sending: Keep overlap buffer of last 25% samples
    const startOfOverlap = this.bufferSize - this.overlapSize;
    
    // Memory-efficient in-place shift of the last 25% to the start of the buffer
    this.buffer.copyWithin(0, startOfOverlap, this.bufferSize);
    
    // Reset index to point just after the overlapped data
    this.bufferIndex = this.overlapSize;
  }
}

// Register processor
registerProcessor("pcm-processor", PCMProcessor);
