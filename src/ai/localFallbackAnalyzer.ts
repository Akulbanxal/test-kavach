/**
 * Kavach AI — Local Fallback Analyzer
 *
 * Pure keyword/regex heuristic analysis on raw transcript text.
 * Activated when Gemini API exhausts retries or exceeds latency threshold.
 * Returns the same GeminiInferenceResponse schema so it's a drop-in replacement.
 *
 * ⚠️ ACCURACY & QUALITY DISCLOSURE:
 * Evaluated on 32 independent adversarial samples (see BENCHMARKS.md):
 * - Medium Risk (0.34): Fallback Recall = 85.0% vs Gemini Path = 100.0% (Recall gap: -15.0%)
 * - High Risk (0.60):   Fallback Recall = 50.0% vs Gemini Path = 100.0% (Recall gap: -50.0%)
 * - Critical Risk (0.80): Fallback Recall = 20.0% vs Gemini Path = 70.0% (Recall gap: -50.0%)
 *
 * Reason: Keyword matching lacks LLM semantic reasoning for paraphrased evasion claims
 * (e.g. "six-digit confirmation number" instead of "OTP"). Active fallback mode displays
 * "Reduced Accuracy Mode" in the UI to prevent false confidence.
 */

import { GeminiInferenceResponse } from './aiTypes';

// ── Keyword Banks ─────────────────────────────────────────────────────────────

const AUTHORITY_KEYWORDS = [
  // English
  'police', 'officer', 'inspector', 'cbi', 'ita', 'income tax', 'court', 'judge',
  'arrest', 'warrant', 'rbi', 'reserve bank', 'sebi', 'ministry', 'government',
  // Hindi / Hinglish
  'police wala', 'inspector sahab', 'daroga', 'nyayalay', 'giraftari', 'warrant hai',
  'sarkar', 'adhikari', 'vibhag', 'thana', 'kebal'
];

const OTP_KEYWORDS = [
  'otp', 'one time password', 'verification code', 'confirm code', 'passcode',
  'secure code', '6 digit', 'six digit',
  // Hindi
  'otp batao', 'code bata', 'code bhejo', 'sms code', 'verification batao'
];

const CREDENTIAL_KEYWORDS = [
  'account number', 'card number', 'cvv', 'pin', 'password', 'atm pin',
  'net banking', 'login', 'username', 'debit card', 'credit card', 'ifsc',
  // Hindi
  'khata number', 'pin number', 'card details', 'account details batao',
  'password batao', 'bank password'
];

const PAYMENT_KEYWORDS = [
  'transfer', 'send money', 'pay', 'upi', 'payment', 'transaction',
  'deposit', 'immediate', 'now', 'right now', 'account blocked',
  'paise bhejo', 'paisa transfer', 'abhi bhejo', 'turant', 'payment karo',
  'rupee', 'paisa', 'bank account mein daalo'
];

const URGENCY_KEYWORDS = [
  'immediately', 'urgent', 'right now', 'asap', 'limited time', 'emergency',
  'last chance', 'final notice', 'today only', 'expire', 'suspended',
  'abhi', 'turant', 'jaldi', 'fauran', 'sirf aaj', 'band ho jayega',
  'block ho jayega', 'kal tak'
];

const MANIPULATION_MAP: Record<string, string[]> = {
  'Fear': ['arrested', 'jail', 'fine', 'penalty', 'action', 'case filed', 'giraftari', 'jail hoga', 'jurmaana'],
  'False Authority': ['i am from', 'calling from', 'official', 'authorized', 'main officer', 'government officer'],
  'Artificial Scarcity': ['only today', 'last chance', 'expires', 'limited', 'sirf aaj', 'akhri mauka'],
  'Social Proof': ['everyone is doing', 'all customers', 'others have', 'as per records'],
  'Flattery': ['you are selected', 'you have won', 'congratulations', 'aap ko mila hai'],
};

const SCAM_CATEGORY_MAP: Record<string, string[]> = {
  'Authority Impersonation': ['police', 'cbi', 'court', 'arrest', 'rbi', 'income tax', 'daroga', 'adhikari', 'warrant'],
  'Bank Scam': ['rbi', 'reserve bank', 'account suspended', 'kyc', 'net banking', 'bank officer', 'bank se bol raha'],
  'Family Emergency': ['accident', 'hospital', 'emergency', 'help me', 'i am stuck', 'main hospital mein', 'mujhe paisa chahiye'],
  'KYC Fraud': ['kyc', 'kyc update', 'kyc expire', 'kyc blocked', 'kyc nahi kiya'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]/g, ' ');
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

function detectManipulation(text: string): string[] {
  const detected: string[] = [];
  for (const [technique, keywords] of Object.entries(MANIPULATION_MAP)) {
    if (matchesAny(text, keywords)) detected.push(technique);
  }
  return detected;
}

function detectScamCategory(text: string): string {
  for (const [category, keywords] of Object.entries(SCAM_CATEGORY_MAP)) {
    if (matchesAny(text, keywords)) return category;
  }
  return 'Unknown';
}

function detectSuspiciousClaims(text: string): string[] {
  const claims: string[] = [];
  if (matchesAny(text, ['your account', 'aapka account', 'account suspended', 'band ho gaya'])) {
    claims.push('Claim that account is suspended or blocked');
  }
  if (matchesAny(text, ['warrant', 'arrest', 'case filed', 'fir'])) {
    claims.push('Threat of arrest or legal action');
  }
  if (matchesAny(text, ['won', 'winner', 'prize', 'lottery', 'jackpot', 'jeeta hai'])) {
    claims.push('False prize or lottery win claim');
  }
  if (matchesAny(text, ['limited time', 'expires today', 'last chance', 'akhri mauka'])) {
    claims.push('Artificial deadline pressure');
  }
  return claims;
}

// ── Main Analyzer ─────────────────────────────────────────────────────────────

export class LocalFallbackAnalyzer {
  analyze(text: string): GeminiInferenceResponse {
    const t = normalize(text);

    const authorityDetected = matchesAny(t, AUTHORITY_KEYWORDS);
    const otpMentioned = matchesAny(t, OTP_KEYWORDS);
    const credentialRequest = matchesAny(t, CREDENTIAL_KEYWORDS);
    const paymentRequest = matchesAny(t, PAYMENT_KEYWORDS);
    const highUrgency = matchesAny(t, URGENCY_KEYWORDS);
    const manipulationTechniques = detectManipulation(t);
    const scamCategory = detectScamCategory(t);
    const suspiciousClaims = detectSuspiciousClaims(t);

    const riskSignals = [
      authorityDetected, otpMentioned, credentialRequest,
      paymentRequest, highUrgency, manipulationTechniques.length > 0
    ].filter(Boolean).length;

    const urgencyLevel = highUrgency ? (riskSignals >= 3 ? 'Critical' : 'High') : 'Low';
    const callerIntent = riskSignals >= 2
      ? 'Fraud / Scam Attempt'
      : riskSignals === 1
      ? 'Suspicious'
      : 'Unknown';

    const emotionalTone = manipulationTechniques.includes('Fear') ? 'Aggressive'
      : highUrgency ? 'Anxious'
      : 'Neutral';

    const conversationStage = riskSignals >= 3 ? 'Escalation'
      : riskSignals >= 1 ? 'Pressure'
      : 'Opening';

    const summary = riskSignals > 0
      ? `Local fallback: detected ${riskSignals} risk signal(s). ${scamCategory !== 'Unknown' ? `Matches ${scamCategory} profile.` : ''}`
      : 'Local fallback: no significant risk signals detected in transcript.';

    const reasoning = `[LOCAL FALLBACK MODE — Gemini unavailable]\n` +
      `Keyword-based analysis detected: authority=${authorityDetected}, ` +
      `otp=${otpMentioned}, credentials=${credentialRequest}, ` +
      `payment=${paymentRequest}, urgency=${highUrgency}. ` +
      `Techniques: ${manipulationTechniques.join(', ') || 'none'}.`;

    return {
      callerIntent,
      scamCategory,
      emotionalTone,
      urgencyLevel,
      authorityDetected,
      credentialRequest,
      paymentRequest,
      otpMentioned,
      manipulationTechniques,
      suspiciousClaims,
      conversationStage,
      summary,
      reasoning,
      aiSource: 'Local Fallback',
      similarScams: [],
      ragCitations: [],
    };
  }
}

export const localFallbackAnalyzer = new LocalFallbackAnalyzer();
