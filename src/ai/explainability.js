/**
 * Kavach AI — Explainability Engine
 *
 * Computes feature contribution percentages (SHAP-style linear model)
 * and maintains a pub/sub registry for live updates.
 */

let subscribers = [];

/**
 * Subscribe a callback to receive real-time explainability data.
 * @param {Function} callback - Callback function receiving explainability payload
 * @returns {Function} Unsubscribe function
 */
export function subscribeToExplainability(callback) {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
}

/**
 * Publish the latest explainability calculations to all subscribers.
 * @param {Object} data - Explainability payload
 */
export function publishExplainability(data) {
  subscribers.forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error("[Explainability] Error in subscriber callback:", err);
    }
  });
}

/**
 * Computes feature contribution percentages for the 5 key dimensions:
 * 1. Pitch Stability (Robotic artifacts)
 * 2. Entropy (Synthesis anomalies)
 * 3. Spectral Flatness (Cadence anomalies)
 * 4. High Frequency Leakage (Vocoder harmonics)
 * 5. Voice Similarity (Match confidence score)
 *
 * Contributions are normalized to sum to exactly 100%.
 */
export function calculateExplainability(features, probability) {
  const pitchVal = features.pitch ?? 0;
  const entropyVal = features.entropy ?? 0;
  const flatnessVal = features.flatness ?? 0;
  const hfLeakageVal = features.hfRatio ?? 0;
  const similarityVal = probability ?? 0;

  // Base weights matching empirical impact in detection
  const wPitch = 0.22;
  const wEntropy = 0.18;
  const wFlatness = 0.15;
  const wHfLeakage = 0.15;
  const wSimilarity = 0.30;

  // Compute raw impact using small baseline offsets to ensure smooth contribution charts even at 0
  const impPitch = Math.max(0.01, pitchVal) * wPitch;
  const impEntropy = Math.max(0.01, entropyVal) * wEntropy;
  const impFlatness = Math.max(0.01, flatnessVal) * wFlatness;
  const impHfLeakage = Math.max(0.01, hfLeakageVal) * wHfLeakage;
  const impSimilarity = Math.max(0.01, similarityVal) * wSimilarity;

  const total = impPitch + impEntropy + impFlatness + impHfLeakage + impSimilarity;

  return {
    pitchStability: {
      label: 'Pitch Stability',
      value: pitchVal,
      contribution: (impPitch / total) * 100
    },
    entropy: {
      label: 'Entropy',
      value: entropyVal,
      contribution: (impEntropy / total) * 100
    },
    spectralFlatness: {
      label: 'Spectral Flatness',
      value: flatnessVal,
      contribution: (impFlatness / total) * 100
    },
    highFrequencyLeakage: {
      label: 'High Frequency Leakage',
      value: hfLeakageVal,
      contribution: (impHfLeakage / total) * 100
    },
    voiceSimilarity: {
      label: 'Voice Similarity',
      value: similarityVal,
      contribution: (impSimilarity / total) * 100
    }
  };
}
