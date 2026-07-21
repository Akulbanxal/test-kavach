/**
 * Kavach AI — Audio DSP Module
 * Performs feature extraction and STFT magnitude computations.
 * Optimized to prevent redundant calculations by reusing STFT outputs.
 */

export function rmsEnergy(f32) {
  let sum = 0;
  for (let i = 0; i < f32.length; i++) sum += f32[i] * f32[i];
  return Math.sqrt(sum / f32.length);
}

export function zeroCrossingRate(f32) {
  let c = 0;
  for (let i = 1; i < f32.length; i++) {
    if ((f32[i] >= 0) !== (f32[i - 1] >= 0)) c++;
  }
  return c / f32.length;
}

/**
 * Reuses the STFT magnitude spectrum to compute spectral flatness.
 * Avoids duplicate sliding window time-domain proxy calculations.
 */
export function calculateSpectralFlatness(mag) {
  if (!mag || mag.length === 0) return 0.5;
  const numBins = mag[0].length;
  
  // Average the magnitude spectrum across all frames
  const ps = new Float32Array(numBins);
  for (let f = 0; f < mag.length; f++) {
    for (let i = 0; i < numBins; i++) {
      ps[i] += mag[f][i] ** 2; // Power spectrum bin
    }
  }
  for (let i = 0; i < numBins; i++) {
    ps[i] /= mag.length;
  }

  let sum = 0;
  let logSum = 0;
  const startBin = numBins === 513 ? 4 : 2; // skip DC and low frequency rumble (matches 62.5 Hz in 512 and 1024 FFT)
  const endBin = numBins;
  const N = endBin - startBin;
  
  for (let i = startBin; i < endBin; i++) {
    const val = Math.max(1e-9, ps[i]);
    sum += val;
    logSum += Math.log(val);
  }
  
  const mean = sum / N;
  const geometricMean = Math.exp(logSum / N);
  return mean > 0 ? Math.min(1, geometricMean / mean) : 0.5;
}

/**
 * Reuses the STFT magnitude spectrum to compute High Frequency Leakage Ratio.
 */
export function calculateHighFreqRatio(mag) {
  if (!mag || mag.length === 0) return 0.0;
  const numBins = mag[0].length;
  
  const ps = new Float32Array(numBins);
  for (let f = 0; f < mag.length; f++) {
    for (let i = 0; i < numBins; i++) {
      ps[i] += mag[f][i] ** 2;
    }
  }
  for (let i = 0; i < numBins; i++) {
    ps[i] /= mag.length;
  }

  const midBin = Math.floor(numBins / 2);
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < numBins; i++) {
    const power = ps[i];
    if (i < midBin) {
      lo += power;
    } else {
      hi += power;
    }
  }
  return hi / (lo + hi + 1e-9);
}

export function pitchStability(f32) {
  const fs = 160;
  const n  = Math.floor(f32.length / fs);
  if (n < 2) return 0.5;
  const rms = [];
  for (let i = 0; i < n; i++) {
    let e = 0;
    for (let j = 0; j < fs; j++) e += f32[i * fs + j] ** 2;
    rms.push(Math.sqrt(e / fs));
  }
  const mean = rms.reduce((a, b) => a + b, 0) / n;
  const variance = rms.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  return Math.min(1, variance / 0.004);
}

export function voiceEntropy(f32) {
  const bins = new Float32Array(16);
  for (let i = 0; i < f32.length; i++) {
    bins[Math.min(15, Math.max(0, Math.floor(((f32[i] + 1) / 2) * 16)))]++;
  }
  let h = 0;
  for (let i = 0; i < 16; i++) {
    const p = bins[i] / f32.length;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h / 4;
}

/**
 * Orchestrator DSP extraction. Takes the raw Float32 audio chunk and the 
 * pre-extracted STFT magnitude spectrum to return a full cognitive feature map.
 */
export function extractDspFeatures(f32, mag) {
  return {
    zcr: zeroCrossingRate(f32),
    flatness: calculateSpectralFlatness(mag),
    pitch: pitchStability(f32),
    hfRatio: calculateHighFreqRatio(mag),
    entropy: voiceEntropy(f32)
  };
}
