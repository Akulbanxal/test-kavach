/**
 * Kavach AI — Modular Fusion Engine
 * Fuses inputs from the LCNN model, DSP feature matchers, biometrics, and transcripts
 * to calculate overall fraud risk scores and decisions.
 */

export const FUSION_CONFIG = {
  weights: {
    lcnn: 0.75,      // Weight of LCNN ONNX deepfake probability
    dsp: 0.25,       // Weight of DSP anti-spoofing signature
  },
  thresholds: {
    suspicious: 0.35,
    critical: 0.80,
    trustedBiometric: 0.85
  }
};

/**
 * Executes cognitive threat fusion across all available security vectors.
 * 
 * @param {Object} inputs
 * @param {number|null} inputs.lcnnSpoofProb - Probability of voice being synthetic from LCNN (0.0 to 1.0)
 * @param {number} inputs.dspConfidence - DSP-based signature match confidence (0.0 to 1.0)
 * @param {number} inputs.voiceSimilarity - Biometric similarity to trusted voice templates (0.0 to 1.0)
 * @param {number} inputs.transcriptScamSimilarity - Transcript semantic scam similarity (0.0 to 1.0)
 * @param {string} inputs.activeAttackType - Current active mock attack type (if any)
 * @param {string} inputs.historicalRiskState - Current active risk state machine status
 * 
 * @returns {Object} Fused threat profile containing probability, confidence, and final risk decision
 */
export function fuseThreatSignals(inputs) {
  const {
    lcnnSpoofProb,
    dspConfidence,
    voiceSimilarity,
    transcriptScamSimilarity = 0.0,
    activeAttackType = null,
    historicalRiskState = 'SAFE'
  } = inputs;

  let aiVoiceProbability = 0.05;

  // 1. Calculate AI Voice Probability (LCNN + DSP Fusion)
  if (lcnnSpoofProb !== null && lcnnSpoofProb !== undefined) {
    // Both engines are active
    aiVoiceProbability = (lcnnSpoofProb * FUSION_CONFIG.weights.lcnn) + 
                         (dspConfidence * FUSION_CONFIG.weights.dsp);
  } else {
    // Fallback: ONNX failed or buffer filling, rely entirely on DSP features
    aiVoiceProbability = dspConfidence;
  }

  // 2. Biometric Whitelisting Override
  const isBiometricVerified = voiceSimilarity >= FUSION_CONFIG.thresholds.trustedBiometric;
  
  if (isBiometricVerified) {
    // If biometric identity is verified, discount deepfake alarm level for safety
    // unless simulating a family clone attack (which mimics whitelisted speech)
    if (activeAttackType !== 'family') {
      aiVoiceProbability = Math.max(0.05, aiVoiceProbability * 0.15);
    }
  }

  // 3. Calculate Scam Pattern Probability
  // Combines text/transcripts risk and acoustic scam indicators
  const scamProbability = Math.max(dspConfidence, transcriptScamSimilarity);

  // 4. Calculate Combined Fraud Confidence
  const overallFraudConfidence = Math.max(aiVoiceProbability, scamProbability);

  // 5. Deduce Final Risk Decision State
  let finalDecision = 'SAFE';
  if (overallFraudConfidence >= FUSION_CONFIG.thresholds.critical) {
    finalDecision = 'CRITICAL';
  } else if (overallFraudConfidence >= FUSION_CONFIG.thresholds.suspicious) {
    finalDecision = 'SUSPICIOUS';
  }

  return {
    aiVoiceProbability,
    scamProbability,
    overallFraudConfidence,
    finalDecision,
    isBiometricVerified
  };
}
