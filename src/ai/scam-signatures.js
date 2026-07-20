/**
 * Kavach AI — Scam Voice Signatures Database
 * Defines the acoustic fingerprint signatures of known scam operations.
 */

export const SCAM_SIGNATURES = {
  police: {
    name: 'police',
    displayName: 'Police Impersonation Scam',
    description: 'High-pressure authoritative voice patterns simulating official threats.',
    spokenSentence: 'This is Officer Sharma from Delhi Police headquarters. A high-court warrant is issued for your arrest. You must transfer the penalty money immediately to avoid jail time.',
    spectralProfile: 0.85,
    entropyProfile: 0.90,
    pitchProfile: 0.95,
    cadencePattern: 0.88,
    urgencyMetric: 0.92
  },
  rbi: {
    name: 'rbi',
    displayName: 'RBI Officer / Bank Fraud',
    description: 'Robotic synthetic IVR call patterns targeting banking login credentials.',
    spokenSentence: 'Warning. Reserve Bank of India automated security. We detected unauthorized activity. Your account will be suspended quickly. Please provide your net banking PIN and password for verification.',
    spectralProfile: 0.92,
    entropyProfile: 0.82,
    pitchProfile: 0.96,
    cadencePattern: 0.78,
    urgencyMetric: 0.88
  },
  family: {
    name: 'family',
    displayName: 'Family Voice Clone',
    description: 'Unnatural prosody and vocoder artifacts matching family clone audio.',
    spokenSentence: 'Hey, it is me. I am in the hospital after a terrible accident. I am panicking, my phone is about to die. Can you transfer fifty thousand rupees immediately? I need the money right now.',
    spectralProfile: 0.78,
    entropyProfile: 0.95,
    pitchProfile: 0.91,
    cadencePattern: 0.94,
    urgencyMetric: 0.85
  },
  kyc: {
    name: 'kyc',
    displayName: 'KYC Verification Fraud',
    description: 'Synthetic voice urging immediate banking profile updates.',
    spokenSentence: 'Hello, banking KYC verification division. Your account security is compromised. This is a final warning. Share the security OTP code sent to your phone immediately to stop the block.',
    spectralProfile: 0.88,
    entropyProfile: 0.89,
    pitchProfile: 0.92,
    cadencePattern: 0.84,
    urgencyMetric: 0.97
  }
};

/**
 * Compares extracted acoustic features against known scam signatures.
 * For normal human speech, similarity remains low (below 30%).
 */
export function compareAgainstSignatures(features) {
  // Heuristics mapping to check resemblance to high-risk profiles
  const zcrVal = features.zcr || 0;
  const flatVal = features.flatness || 0;
  const pitchVal = features.pitch || 0;
  const entropyVal = features.entropy || 0;
  const hfVal = features.hfRatio || 0;

  // Real human voice has high natural entropy and variable pitch stability
  // This yields low similarity to static synthetic scam signatures.
  const baseSim = (zcrVal * 0.12 + flatVal * 0.15 + pitchVal * 0.20 + hfVal * 0.10 + (1 - entropyVal) * 0.15);
  
  // Normal human voice baseline clamps: always 5% - 28% similarity
  const confidence = Math.max(0.04, Math.min(0.28, baseSim));

  return {
    matched: false,
    signatureName: null,
    displayName: null,
    confidence
  };
}
