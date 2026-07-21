"""
Calibrate the ONNX model's output range with realistic mel spectrogram values.
We need to find the model's output for:
 - Simulated real human voice (speech-like mel, with natural variance)
 - Simulated AI/TTS voice (flat, repetitive mel)
"""
import onnxruntime as ort
import numpy as np

sess = ort.InferenceSession('public/models/deepfake_detector.onnx')

def run(data):
    out = sess.run(None, {'input_values': data})
    logits = out[0][0]
    exp = np.exp(logits - np.max(logits))
    probs = exp / exp.sum()
    return probs

# Simulate what our ln-scale mel looks like for real speech
# ln(mel_power + 1e-8) where mel_power ~1e-4 to 1e-2
# → ln values roughly -18 to -4.6 for real speech frames
# → We'll simulate with values in that range with natural variance

# Typical human speech mel: varying values, ~-12 mean, +/- 4 std
speech_mel = np.random.normal(-12, 4, (1, 1, 128, 251)).astype(np.float32)
# Clip to physically plausible range
speech_mel = np.clip(speech_mel, -25, 0)
probs = run(speech_mel)
print(f"Simulated real speech (ln-mel, mean=-12): probs[0]={probs[0]:.4f}, probs[1]={probs[1]:.4f} → spoof_idx1={probs[1]:.4f}")

# Flat AI/TTS mel: very uniform spectral energy (unnaturally flat)
flat_mel = np.full((1, 1, 128, 251), -8.0, dtype=np.float32) + np.random.normal(0, 0.2, (1, 1, 128, 251)).astype(np.float32)
probs = run(flat_mel)
print(f"Simulated TTS (flat ln-mel, val=-8):     probs[0]={probs[0]:.4f}, probs[1]={probs[1]:.4f} → spoof_idx1={probs[1]:.4f}")

# Higher variance (lively human speech)
lively = np.random.normal(-10, 6, (1, 1, 128, 251)).astype(np.float32)
probs = run(lively)
print(f"High-variance speech (mean=-10, std=6):  probs[0]={probs[0]:.4f}, probs[1]={probs[1]:.4f} → spoof_idx1={probs[1]:.4f}")

# Low energy / quieter speech  
quiet = np.random.normal(-20, 3, (1, 1, 128, 251)).astype(np.float32)
probs = run(quiet)
print(f"Quiet speech (mean=-20, std=3):          probs[0]={probs[0]:.4f}, probs[1]={probs[1]:.4f} → spoof_idx1={probs[1]:.4f}")

# Values normalized per-utterance (mean=0, std=1)
mvn_speech = np.random.normal(0, 1, (1, 1, 128, 251)).astype(np.float32)
probs = run(mvn_speech)
print(f"MVN-normalized speech (mean=0, std=1):   probs[0]={probs[0]:.4f}, probs[1]={probs[1]:.4f} → spoof_idx1={probs[1]:.4f}")

# MVN flat (TTS-like - all zeros after normalization since it has no variance)
mvn_flat = np.zeros((1, 1, 128, 251), dtype=np.float32)
probs = run(mvn_flat)
print(f"MVN-flat TTS (all zeros, no variance):   probs[0]={probs[0]:.4f}, probs[1]={probs[1]:.4f} → spoof_idx1={probs[1]:.4f}")

# Try raw power (no log) values
raw_power = np.random.uniform(0, 0.05, (1, 1, 128, 251)).astype(np.float32)
probs = run(raw_power)
print(f"Raw mel power (linear, 0-0.05):          probs[0]={probs[0]:.4f}, probs[1]={probs[1]:.4f} → spoof_idx1={probs[1]:.4f}")
