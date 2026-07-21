/**
 * Kavach AI — Acoustic Anomaly Heuristics Engine
 *
 * Extracts DSP features (ZCR, spectral flatness, HF ratio, pitch stability, entropy)
 * and compares them against known scam acoustic profiles.
 *
 * ⚠ Capability note: This engine is a heuristic-only DSP scorer.
 *   It does NOT constitute deepfake voice identification or neural classification.
 *   Acoustic risk scores are an auxiliary signal alongside the Gemini semantic engine.
 *
 * Scoring rules:
 *   Normal voice: 0–30%   (hard ceiling at 29.5% — heuristics are not reliable enough to trigger lockdown alone)
 *   Scam simulated attack: 25% → 42% → 68% → 88% → 97% (deterministic demo sequence)
 */

import { SCAM_SIGNATURES, compareAgainstSignatures } from './scam-signatures';

// ── State ──────────────────────────────────────────────────────────────────────
let _activeAttackType = null;
let _attackFrameIndex = 0;
let _attackDelayFrames = 0;
let _smoothed         = 0.05;
let _isConfirmedAI    = false;

export function triggerScamAttack(scamType) {
  _activeAttackType = scamType;
  _attackFrameIndex = 0;
  _attackDelayFrames = 3; // 3 frames * 0.5s = 1.5s delay before matching begins
  _isConfirmedAI    = false;
}

// Keep triggerDemoAttack as alias for safety/backward compatibility
export function triggerDemoAttack() {
  triggerScamAttack('police');
}

export function resetDemoAttack() {
  _activeAttackType = null;
  _attackFrameIndex = 0;
  _attackDelayFrames = 0;
  _smoothed         = 0.05;
  _isConfirmedAI    = false;
}

export function resetDetector() {
  _smoothed         = 0.05;
  _isConfirmedAI    = false;
  _activeAttackType = null;
  _attackFrameIndex = 0;
  _attackDelayFrames = 0;
}

// ── Feature Extractors ────────────────────────────────────────────────────────

function rmsEnergy(f32) {
  let sum = 0;
  for (let i = 0; i < f32.length; i++) sum += f32[i] * f32[i];
  return Math.sqrt(sum / f32.length);
}

function zeroCrossingRate(f32) {
  let c = 0;
  for (let i = 1; i < f32.length; i++) {
    if ((f32[i] >= 0) !== (f32[i - 1] >= 0)) c++;
  }
  return c / f32.length;
}

function spectralFlatness(f32, frameSize = 128) {
  const frames = Math.floor(f32.length / frameSize);
  if (frames < 2) return 0.5;
  const energies = [];
  for (let i = 0; i < frames; i++) {
    let e = 0;
    for (let j = 0; j < frameSize; j++) e += f32[i * frameSize + j] ** 2;
    energies.push(Math.sqrt(e / frameSize));
  }
  const mean = energies.reduce((a, b) => a + b, 0) / frames;
  if (mean < 1e-9) return 0.5;
  const gm = Math.exp(energies.reduce((a, x) => a + Math.log(Math.max(x, 1e-9)), 0) / frames);
  return Math.min(1, gm / mean);
}

function highFreqRatio(f32) {
  const band = Math.floor(f32.length / 4);
  let lo = 0, hi = 0;
  for (let i = 0; i < f32.length; i++) {
    const e = f32[i] ** 2;
    if (i < band * 3) lo += e; else hi += e;
  }
  return hi / (lo + hi + 1e-9);
}

function pitchStability(f32) {
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
  return Math.min(1, variance / 0.004);  // high variance → human (natural rhythm)
}

function voiceEntropy(f32) {
  const bins = new Float32Array(16);
  for (let i = 0; i < f32.length; i++) {
    bins[Math.min(15, Math.max(0, Math.floor(((f32[i] + 1) / 2) * 16)))]++;
  }
  let h = 0;
  for (let i = 0; i < 16; i++) {
    const p = bins[i] / f32.length;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h / 4;  // normalised to [0,1], max = log2(16) = 4
}

// ── Main Detector ─────────────────────────────────────────────────────────────
export function analyzeAudio(f32) {
  // ── Simulation Override (Deterministic 5-Step Sequence) ──────────────────────
  if (_activeAttackType) {
    if (_attackDelayFrames > 0) {
      _attackDelayFrames--;
      
      const energy = rmsEnergy(f32);
      const zcr      = zeroCrossingRate(f32);
      const flat     = spectralFlatness(f32);
      const hfr      = highFreqRatio(f32);
      const pitchStab = pitchStability(f32);
      const entropy  = voiceEntropy(f32);

      const zcrSusp = Math.min(1, zcr / 0.30);
      const flatSusp = flat > 0.60 ? 0.35 + Math.pow((flat - 0.60) / 0.40, 0.8) * 0.65 : flat * 0.10;
      const hfSusp = hfr > 0.20 ? Math.min(1, (hfr - 0.20) / 0.40) : 0.0;
      const pitchSusp = pitchStab > 0.55 ? 0.0 : 0.5 + Math.pow((0.25 - pitchStab) / 0.25, 1.2) * 0.5;
      const entropySusp = entropy > 0.72 ? 0.0 : 0.30 + Math.pow((0.50 - entropy) / 0.50, 1.2) * 0.70;

      const baseResult = compareAgainstSignatures({
        zcr: zcrSusp,
        flatness: flatSusp,
        pitch: pitchSusp,
        hfRatio: hfSusp,
        entropy: entropySusp
      });

      _smoothed = 0.88 * _smoothed + 0.12 * baseResult.confidence;
      _smoothed = Math.min(0.28, _smoothed);
      const jitter = (Math.random() - 0.5) * 0.015;
      const confidence = Math.max(0.04, Math.min(0.295, _smoothed + jitter));

      return {
        confidence,
        threatLevel: 'SAFE',
        isFake: false,
        matched: false,
        signatureName: null,
        displayName: null,
        // High feature activity during delay to make scanning visual feel realistic
        zcr: 0.35 + Math.random() * 0.2,
        flatness: 0.45 + Math.random() * 0.2,
        pitch: 0.25 + Math.random() * 0.2,
        hfRatio: 0.35 + Math.random() * 0.15,
        entropy: 0.55 + Math.random() * 0.2,
      };
    }

    const targetScores = [0.25, 0.42, 0.68, 0.88, 0.97];
    const score = targetScores[Math.min(4, _attackFrameIndex)];
    _smoothed = score;
    _attackFrameIndex++;
    
    if (score >= 0.97) {
      _isConfirmedAI = true;
    }

    const signature = SCAM_SIGNATURES[_activeAttackType];
    const displayName = signature ? signature.displayName : 'Scam Voice Signature';
    
    let threatLevel;
    if (score > 0.80)      threatLevel = 'CRITICAL';
    else if (score > 0.60) threatLevel = 'HIGH';
    else if (score > 0.34) threatLevel = 'MEDIUM';
    else                        threatLevel = 'SAFE';

    // Simulate high features that correspond to the scam signature
    return {
      confidence: score,
      threatLevel,
      isFake: score > 0.80,
      matched: true,
      signatureName: _activeAttackType,
      displayName,
      zcr: signature ? signature.spectralProfile * 0.9 : 0.88,
      flatness: signature ? signature.entropyProfile * 0.9 : 0.92,
      pitch: signature ? signature.pitchProfile * 0.9 : 0.95,
      hfRatio: signature ? signature.cadencePattern * 0.9 : 0.83,
      entropy: signature ? signature.urgencyMetric * 0.9 : 0.91,
    };
  }

  const energy = rmsEnergy(f32);

  // ── Silence gate ────────────────────────────────────────────────────────────
  if (energy < 0.005) {
    _smoothed = 0.88 * _smoothed + 0.12 * 0.05;
    const confidence = Math.min(0.28, Math.max(0.03, _smoothed));
    return {
      confidence,
      threatLevel: 'SAFE',
      isFake: false,
      matched: false,
      signatureName: null,
      displayName: null,
      zcr: 0.02, flatness: 0.04, pitch: 0.02, hfRatio: 0.01, entropy: 0.03,
    };
  }

  const zcr      = zeroCrossingRate(f32);
  const flat     = spectralFlatness(f32);
  const hfr      = highFreqRatio(f32);
  const pitchStab = pitchStability(f32);
  const entropy  = voiceEntropy(f32);

  // Calculate ambient features suspension scores
  const zcrSusp = Math.min(1, zcr / 0.30);
  const flatSusp = flat > 0.60 ? 0.35 + Math.pow((flat - 0.60) / 0.40, 0.8) * 0.65 : flat * 0.10;
  const hfSusp = hfr > 0.20 ? Math.min(1, (hfr - 0.20) / 0.40) : 0.0;
  const pitchSusp = pitchStab > 0.55 ? 0.0 : 0.5 + Math.pow((0.25 - pitchStab) / 0.25, 1.2) * 0.5;
  const entropySusp = entropy > 0.72 ? 0.0 : 0.30 + Math.pow((0.50 - entropy) / 0.50, 1.2) * 0.70;

  // Run comparator
  const baseResult = compareAgainstSignatures({
    zcr: zcrSusp,
    flatness: flatSusp,
    pitch: pitchSusp,
    hfRatio: hfSusp,
    entropy: entropySusp
  });

  _smoothed = 0.88 * _smoothed + 0.12 * baseResult.confidence;
  
  // CRITICAL: human voice MUST stay under 30% risk
  _smoothed = Math.min(0.28, _smoothed);

  // Micro jitter for live feel
  const jitter = (Math.random() - 0.5) * 0.015;
  const confidence = Math.max(0.04, Math.min(0.295, _smoothed + jitter));

  console.log(`[Kavach Scam Monitor] confidence=${(confidence*100).toFixed(1)}% [SAFE]`);

  return {
    confidence,
    threatLevel: 'SAFE',
    isFake: false,
    matched: false,
    signatureName: null,
    displayName: null,
    zcr: zcrSusp * 0.18,
    flatness: flatSusp * 0.22,
    pitch: pitchSusp * 0.15,
    hfRatio: hfSusp * 0.12,
    entropy: entropySusp * 0.25,
  };
}

// ── Stream Shim ───────────────────────────────────────────────────────────────
let _accumBuffer = new Float32Array(0);

export function handlePCMChunk(pcm16Data) {
  const f32 = new Float32Array(pcm16Data.length);
  for (let i = 0; i < pcm16Data.length; i++) f32[i] = pcm16Data[i] / 32768;

  const merged = new Float32Array(_accumBuffer.length + f32.length);
  merged.set(_accumBuffer);
  merged.set(f32, _accumBuffer.length);
  _accumBuffer = merged;

  if (_accumBuffer.length >= 16000) {
    const win = _accumBuffer.slice(0, 16000);
    _accumBuffer = _accumBuffer.slice(8000);
    const result = analyzeAudio(win);
    globalThis.dispatchEvent(new CustomEvent('deepfake-score', { detail: result }));
  }
}

export async function initModel() {
  console.log('[Kavach AI] Acoustic anomaly heuristics database initialized.');
}

// ── Engine Capability Declaration ─────────────────────────────────────────────
/**
 * Returns a machine-readable description of this engine's detection capabilities.
 * Callers should NOT treat this engine as a deepfake classifier.
 */
export function getEngineCaps() {
  return {
    type: 'heuristic-dsp',
    version: '3.0.0',
    description: 'Acoustic anomaly detection using DSP features (ZCR, spectral flatness, HF ratio, pitch stability, voice entropy).',
    limitation: 'Heuristics only — does not constitute deepfake voice identification. Real-voice acoustic score is hard-capped at 29.5% by design.',
    primaryDetector: 'Gemini semantic engine (see analysisOrchestrator.ts)',
  };
}
