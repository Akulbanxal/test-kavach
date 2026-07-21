/**
 * Kavach AI — Inference Engine
 * Manages ONNX Runtime sessions and executes deepfake classifications.
 */

import * as ort from 'onnxruntime-web';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/';

let _session = null;
let _sessionLoading = false;

/**
 * Loads the deepfake detector model using dynamic execution provider selection.
 */
export async function getInferenceSession() {
  if (_session) return _session;
  if (_sessionLoading) {
    while (_sessionLoading) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return _session;
  }
  _sessionLoading = true;
  try {
    console.log('[Inference Engine] Loading ONNX model...');
    _session = await ort.InferenceSession.create('/models/deepfake_detector.onnx', {
      executionProviders: ['webgpu', 'wasm']
    });
    console.log('[Inference Engine] Loaded on provider:', _session.provider || 'webgpu/wasm');
  } catch (err) {
    console.warn('[Inference Engine] Failed with WebGPU/WASM, falling back to WASM...', err);
    try {
      _session = await ort.InferenceSession.create('/models/deepfake_detector.onnx', {
        executionProviders: ['wasm']
      });
      console.log('[Inference Engine] Loaded on WASM fallback');
    } catch (fallbackErr) {
      console.error('[Inference Engine] Critical: Failed to load ONNX model', fallbackErr);
      throw fallbackErr;
    }
  } finally {
    _sessionLoading = false;
  }
  return _session;
}

/**
 * Runs inference over the preprocessed Mel Spectrogram tensor.
 * Returns the raw similarity score.
 */
export async function runONNXInference(session, melSpec) {
  if (!session) return null;
  try {
    const tensor = new ort.Tensor('float32', melSpec, [1, 1, 128, 251]);
    const outputs = await session.run({ input_values: tensor });
    const logits = outputs.logits.data;
    
    // Softmax calculation
    const max = Math.max(...logits);
    const exps = logits.map(x => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map(x => x / sum);
    
    return probs[1]; // LCNN Index 1: spoof/AI-generated voice probability
  } catch (e) {
    console.error('[Inference Engine] Execution failed:', e);
    return null; // Graceful fallback
  }
}
