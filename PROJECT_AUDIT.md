# Kavach AI — Full Project Technical Audit & Report

> **Repository**: [swapnilyt1234/Kavach-AI](https://github.com/swapnilyt1234/Kavach-AI)  
> **Production Backend**: `https://kavachai-backend-44254233486.us-central1.run.app`  
> **Stack**: React 19 + Vite + TypeScript/JSX, Framer Motion, WebRTC, Google Cloud Speech-to-Text, Gemini 1.5 Flash  
> **Report Date**: 2026-07-21 (Complete Audit Report)

---

## 🎯 Executive Summary

Kavach AI is a **browser-based real-time audio scam detection system** designed to protect digital banking users from voice-based financial fraud during live phone calls. It combines two parallel detection layers:

1. **Acoustic Anomaly Engine** — Analyses raw microphone audio in real-time via DSP features (ZCR, spectral flatness, pitch stability, entropy, HF ratio), capped at 29.5% for real human voices to prevent false positives.
2. **Semantic / NLP Intelligence Engine** — Transcribes speech, streams it to a Gemini 1.5 Flash backend (with automatic failover to `localFallbackAnalyzer`), and applies an 8-rule explainable scoring engine + RAG embeddings to detect fraud intent.

When risk exceeds 95%, the system triggers an **emergency transaction lockdown**, suspending UPI payments and generating an in-browser **SHA-256 tamper-evident forensic report**.

---

## 🏗️ System Architecture

```
Microphone Audio
      │
      ├──▶ ConsentModal (Pre-call user authorization gate)
      │
      ▼
 SpeechProvider (WebSocket → Backend / Local Fallback)
      │ WEBM/Opus audio stream (250ms chunks)
      ▼
 Backend (Google Cloud Run)
   ├── STT (Google Cloud Speech-to-Text - en-US / hi-IN)
   └── WebSocket → partial/final transcript
      │
      ▼
 TranscriptAccumulator (3s silence timeout)
      │ Final transcript chunk
      ▼
 GeminiAnalyzer (POST /api/analyze with 3-retry backoff)
      │  └─▶ [Failover] localFallbackAnalyzer (Keyword regex matcher)
      │ Gemini structured JSON response
      ▼
 RuleEngine (8 explainable rules, 0–100 score + RAG bonus)
      │
      ▼
 RiskEngine (Adaptive convergence smoothing with streak acceleration)
      │ probability ∈ [0.05, 1.0]
      ▼
 AnalysisOrchestrator (State manager + latest-wins queue)
      │ Publishes UIOrchestratorState
      ▼
 React UI (App.jsx)
      ├── Progressive Payment Guard (20% → 50% → 70% → 90%)
      ├── Emergency Lockdown (≥95%)
      └── SHA-256 Forensic Hash Chain (Crypto.js → InvestigationReport.pdf)

──────── PARALLEL ACOUSTIC PIPELINE ────────

Microphone Audio (raw PCM)
      │
      ▼
 stream-handler.js (WebRTC loopback)
      │ Int16Array 8000-sample chunks
      ▼
 model-runner.js (DSP Anomaly Heuristics, hard-capped @ 29.5%)
      │ AudioEvent: deepfake-score
      ▼
 StatusBadge / CallPanel display
```

---

## 📂 Detailed Module Breakdown

### 1. 🎤 Audio Capture & Consent Layer

#### `src/components/ConsentModal.jsx`
- Mandatory user consent screen displayed prior to calling `navigator.mediaDevices.getUserMedia`.
- Discloses that audio will be streamed to Google Cloud STT & Gemini AI for fraud analysis.
- Links to `PRIVACY.md`.

#### `PRIVACY.md`
- Documents data flows: raw audio in-flight transcription, zero server storage, local hash-chaining, and hackathon disclaimer.

#### `src/webrtc/stream-handler.js`
- Intercepts microphone audio via a local WebRTC peer connection loopback.
- Uses `public/worklets/pcm-processor.js` to extract 16kHz `Int16Array` PCM chunks (500ms windows).

---

### 2. 🧠 Acoustic Anomaly Heuristics (`src/ai/model-runner.js`)

**Reframed to Acoustic Anomaly Heuristics** (honest capability framing).
- **DSP Feature Extractors**:
  - `rmsEnergy`: Silence gating (< 0.005)
  - `zeroCrossingRate` (ZCR): Sign-change frequency
  - `spectralFlatness`: Ratio of geometric to arithmetic spectral mean
  - `highFreqRatio`: High-band energy ratio
  - `pitchStability`: RMS frame variance
  - `voiceEntropy`: Shannon entropy over 16 amplitude bins
- **Safety Ceiling**: Real voice suspicion score is **hard-capped at 29.5%** — acoustic metrics serve solely as an auxiliary visual indicator and cannot trigger false lockdowns alone.
- **Capability Export**: `getEngineCaps()` returns machine-readable engine limitations.

---

### 3. 🗣️ Speech, Transcript & Multilingual Pipeline

#### `src/components/CallPanel.jsx`
- Added **Detection Language Selector**: English (`en-US`) and Hindi (`hi-IN` / Hinglish).
- Displays 6 simulation attack buttons (4 English + 2 Hindi).

#### `src/ai/scam-signatures.js`
- Added Hindi/Hinglish scam signature profiles:
  - `police_hindi`: Crime branch impersonation with penalty transfer demands.
  - `banking_hindi`: Bank KYC expiry scam with OTP and block pressure.
- Configured speech synthesis rate and pitch parameters for realistic text-to-speech demo rendering.

#### `src/ai/speechProvider.ts`
- Connects to `ws/speech` WebSocket endpoint with configurable language parameter (`en-US` / `hi-IN`).
- `injectSimulatedTranscript(text)` automatically falls back to in-memory `onTranscript` delivery if the WebSocket connection is offline, ensuring 100% reliable local demo execution.

---

### 4. 🤖 AI Semantic Analyzer & Local Fallback

#### `src/ai/geminiAnalyzer.ts`
- Sends 20-chunk rolling context to `POST /api/analyze` (Google Cloud Run backend).
- 3-attempt exponential backoff retry logic (500ms → 1s → 2s).
- **Failover**: If all 3 retries fail or API quota is exhausted, automatically activates `localFallbackAnalyzer.ts`.

#### `src/ai/localFallbackAnalyzer.ts`
- Standalone zero-latency keyword & regex matching engine.
- Scans raw transcript text for English & Hindi/Hinglish scam vocabulary (`police wala`, `giraftari`, `daroga`, `vibhag`, `otp`, `pin`, `cvv`, `transfer`, `upi`).
- Returns the identical `GeminiInferenceResponse` schema to maintain seamless pipeline downstream logic.

#### ⚠️ Fallback Accuracy Disclosure & UI Warning Badge:
- **Accuracy Gap**: Evaluated on 32 independent adversarial samples (see BENCHMARKS.md):
  - Medium Risk (0.34): Fallback Recall = **85.0%** vs Gemini Path = **100.0%** (-15% gap)
  - High Risk (0.60): Fallback Recall = **50.0%** vs Gemini Path = **100.0%** (-50% gap)
  - Critical Risk (0.80): Fallback Recall = **20.0%** vs Gemini Path = **70.0%** (-50% gap)
- **UI Indicator**: Added persistent `⚠️ REDUCED ACCURACY MODE` UI badge in navbar and quota toast notification whenever `aiSource === 'Local Fallback'`.

---

### 5. ⚖️ Explainable Rule Engine (`src/ai/ruleEngine.ts`)

Calculates a deterministic 0–100 point score based on 8 explainable rules:

| Rule ID | Trigger Condition | Points |
|---|---|---|
| `AUTH_IMPERSONATION` | `authorityDetected` + malicious intent | 20 |
| `OTP_REQUEST` | `otpMentioned === true` | 25 |
| `CREDENTIAL_REQUEST` | `credentialRequest === true` | 20 |
| `PAYMENT_REQUEST` | `paymentRequest === true` | 20 |
| `HIGH_URGENCY` | urgencyLevel = 'High' / 'Critical' | 10 |
| `KNOWN_SCAM` | `scamCategory !== 'Unknown'` | 20 |
| `MANIPULATION` | 1–3+ psychological tactics | 4–12 |
| `ESCALATION` | Stage = 'Escalation' / Tone = 'Aggressive' | 8 |

- **RAG Bonus**: `semanticConfidence × 15` points added from vector similarity search.

---

### 6. 📊 Risk Engine & Convergence (`src/ai/riskEngine.ts`)

Smooths raw score into an animated risk probability $P \in [0.05, 1.0]$.

#### Convergence Algorithm Enhancements:
- **Sustained High Confidence Acceleration**: Tracks `highConfidenceStreak` when rule score $\ge 75$.
- When `highConfidenceStreak >= 2`, `convergenceRate` gains a +0.15 rate boost (capping at 0.98).
- When `targetConfidence >= 0.90` and `highConfidenceStreak >= 2`, `effectiveTarget` receives a +0.06 shift (e.g. $0.90 \rightarrow 0.96$), solving the mathematical asymptote.

#### Convergence Latency Optimization Results:
| Target Score ($S$) | Target ($T$) | Frames to LOCKDOWN (Before) | Frames to LOCKDOWN (After) | Time to LOCKDOWN (After) | Time Savings |
|---|---|---|---|---|---|
| **90** | 0.90 | **Never** | **3 frames** | **9.0s** | **Fixed Asymptote!** |
| **95** | 0.95 | **5 frames** | **2 frames** | **6.0s** | **-9.0s (-60%)** |
| **100** | 1.00 | **1 frame** | **1 frame** | **3.0s** | **Instant** |

- **False Positive Rate**: **0.0%** (0 false positives across 30 total benign calls).

---

### 7. 🔗 SHA-256 Cryptographic Hash-Chaining & Security Scope

#### `src/ai/crypto.js` & `src/App.jsx`
- When a lockdown occurs, every log entry is processed through `sha256(entry + prevHash)`.
- Builds a **tamper-evident** hash chain starting from genesis block `000...000`.

#### 🛡 Security Scope & Limitations (`SECURITY_NOTES.md`):
- **What it protects**: Detects retroactive edits or deletion of log entries after they are appended to the session chain.
- **What it does NOT protect**: Does not protect against a malicious operator who controls the host browser/device before log entries are hashed, since all hashing is client-side.
- **Purpose**: Establishes chain-of-custody log integrity for session audit reports, not zero-trust proof against host machine compromise.

---

### 8. ⏱ End-to-End Latency & Benchmark Results (`scripts/benchmark.js`)

#### End-to-End Latency Metrics Comparison:
> $\text{Latency}_{\text{E2E}} = t_{\text{Chunk Finalize}} \rightarrow t_{\text{Network Roundtrip (/api/analyze)}} \rightarrow t_{\text{Rule Engine}} \rightarrow t_{\text{Risk Engine}} \rightarrow t_{\text{UI State Publish}}$

| Pipeline Path | Processing Engine | Average Latency | P50 (Median) | P95 Latency | Operational Bottleneck |
|---|---|---|---|---|---|
| **Gemini Path (Cloud)** | Vertex AI (Gemini 1.5 Flash) + RAG | **9,089.5 ms** | **8,083.9 ms** | **14,041.9 ms** | Cloud Run Network RTT + Gemini LLM Inference |
| **Fallback Path (Local)** | Keyword Regex (`localFallbackAnalyzer`) | **0.025 ms** | **0.019 ms** | **0.041 ms** | In-browser JS Regex |
| **Rule Engine Only** | Point Scoring (`ruleEngine.ts`) | **0.0051 ms** | **0.0005 ms** | **0.0180 ms** | In-memory calculation |

#### Accuracy Metrics across Dual Test Sets:
Evaluates 40 synthetic self-authored samples + 32 independent adversarial samples (paraphrased scams, multi-chunk calls, benign mimics, Hindi evasions):

| Test Set | Pipeline Mode | Threshold | Precision | Recall | F1 Score | TP | FP | FN | TN |
|---|---|---|---|---|---|---|---|---|---|
| **Self-Authored (40)** | Full Pipeline | **MEDIUM (0.34)** | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 20 |
| **Self-Authored (40)** | Full Pipeline | **HIGH (0.60)** | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 20 |
| **Self-Authored (40)** | Full Pipeline | **CRITICAL (0.80)** | 100.0% | 65.0% | 78.8% | 13 | 0 | 7 | 20 |
| **Adversarial (32)** | **Full Pipeline** | **MEDIUM (0.34)** | **100.0%** | **100.0%** | **100.0%** | 20 | 0 | 0 | 12 |
| **Adversarial (32)** | **Full Pipeline** | **HIGH (0.60)** | **100.0%** | **100.0%** | **100.0%** | 20 | 0 | 0 | 12 |
| **Adversarial (32)** | **Full Pipeline** | **CRITICAL (0.80)** | **100.0%** | **70.0%** | **82.4%** | 14 | 0 | 6 | 12 |

---

### 9. 📋 Data Sourcing & Empirical Validation Limitations

#### Sourcing of Scam Signatures & Local Vocabulary
The Hindi/Hinglish scam simulation profiles in `src/ai/scam-signatures.js` and local keyword banks in `src/ai/localFallbackAnalyzer.ts` were authored based on public regulatory advisories and cybercrime bulletins:
1. **RBI Public Press Releases & Advisories**:
   - Digital Arrest Scam Warning ([PR No. 56702](https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=56702))
   - UPI PIN Safety Advisory ([PR No. 53573](https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53573))
   - Account Suspension & KYC Threats ([Report ID 1246](https://rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=1246))
   - OTP & Banking Credential Rules ([Report ID 1213](https://rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=1213))
2. **CERT-In (Indian Computer Emergency Response Team) Bulletins**:
   - Official advisories on Fake CBI/Police calls and Telecom / TRAI disconnection scams.
3. **Cybercrime Helpline 1930 & Investigative News Reports**:
   - Documented phrasing from real-world Indian voice scams (*"police wala"*, *"kachehri"*, *"giraftari warrant"*, *"clearance fee"*).

#### Validation Limitations & Next Steps
- **Lack of Empirical Field Call Validation**: The synthetic audio profiles and keyword banks have **NOT** been validated against an empirical dataset of real-world recorded scam calls, nor formally audited by native Hindi/Hinglish speakers with direct exposure to live fraud operations.
- **Evaluation Scope**: Benchmarks demonstrate performance on synthetic self-authored and adversarial test sets. They do **not** guarantee identical recall against unstudied field-dialect variations or novel live scam scripts.
- **Production Roadmap**: Partnering with telecom operators, financial intelligence units, or cybercrime authorities to evaluate and calibrate rules against anonymized real-call audio datasets is a mandatory next step before production deployment.

---

## 📑 Feature & Architecture Status (3 Tiers)

### Tier 1 — Active in Main Flow (Shipped & Demoable)
| Feature | Implementation File | Status |
|---|---|---|
| Audio Capture & WebRTC Loopback | `src/webrtc/stream-handler.js` | ✅ Active |
| Acoustic Anomaly Heuristics (DSP) | `src/ai/model-runner.js` | ✅ Active (Capped @ 29.5%) |
| Speech STT Stream | `src/ai/speechProvider.ts` | ✅ Active (Google Cloud STT) |
| Gemini NLP Intelligence | `src/ai/geminiAnalyzer.ts` | ✅ Active (Gemini 1.5 Flash) |
| Local Keyword Fallback Engine | `src/ai/localFallbackAnalyzer.ts` | ✅ Active (API retry failover) |
| 8-Rule Risk Engine | `src/ai/ruleEngine.ts` | ✅ Active (0-100 explainable pts) |
| Risk Convergence Engine | `src/ai/riskEngine.ts` | ✅ Active (Smooth transitions + Streak boost) |
| Pre-Call Consent Modal | `src/components/ConsentModal.jsx` | ✅ Active (Mandatory gate) |
| Multi-Lingual Detection (En/Hi) | `src/components/CallPanel.jsx` | ✅ Active (Selector + 6 profiles) |
| SHA-256 Hash-Chaining | `src/ai/crypto.js` | ✅ Active (Tamper-evident log chain) |
| Progressive Payment Guard | `src/components/PaymentGuard.jsx` | ✅ Active (4-tier friction) |
| Emergency Lockdown | `src/components/SecurityOverlay.jsx` | ✅ Active (≥95% trigger) |
| PDF Investigation Report | `src/components/InvestigationReport.jsx` | ✅ Active (Exportable PDF) |
| Benchmark Harness | `scripts/benchmark.js` | ✅ Active (Dual test sets + E2E latency) |

---

### Tier 2 — Present in Codebase (Experimental / Future Scope)
| Component | Path | Reason Not Wired in Default Flow |
|---|---|---|
| ONNX Deepfake Model Session | `src/ai/inference.js` | Requires per-utterance MVN normalization unsuitable for live browser stream. |
| Multi-Signal Fusion Engine | `src/ai/fusion-engine.js` | Superceded by direct RuleEngine + RiskEngine integration. |
| Hysteresis State Machine | `src/ai/risk-state-machine.js` | Replaced by continuous exponential convergence. |
| SHAP Feature Attribution | `src/ai/explainability.js` | UI displays rule-based evidence cards. |
| Voice Enrollment DB | `src/ai/db.js` | Biometric enrollment deferred to future scope. |

---

### Tier 3 — Deprecated / Removed
| Feature | Reason |
|---|---|
| Uncapped Acoustic Deepfake Scoring | Pure DSP metrics misidentified fast human speech; re-framed as auxiliary 29.5% capped heuristics. |
| Client-Side Direct LLM Calls | API keys exposed; replaced by Cloud Run proxy architecture. |
