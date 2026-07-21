# Kavach AI — Benchmark & Adversarial Evaluation Report

> ⚠ **Evaluation Disclaimer**:
> This benchmark compares two distinct evaluation sets:
> 1. **Self-Authored Test Set**: 40 synthetic samples crafted alongside rule development.
> 2. **Adversarial Independent Test Set**: 32 novel samples designed specifically to evaluate evasion resistance, progressive multi-chunk escalation, benign mimic false positives, and Hindi vocabulary paraphrasing.

---

## ⏱ End-to-End Detection Latency

> **CRITICAL ARCHITECTURAL NOTE**: 
> Pure 'ruleEngine.ts' execution time (~0.005 ms) is **not** the operational latency bottleneck. 
> The real-time performance of Kavach AI is governed by the **End-to-End (E2E) Pipeline Latency**, which spans:
> 
> Latency_E2E = t_Chunk_Finalize -> t_Network_Roundtrip (/api/analyze) -> t_Rule_Engine -> t_Risk_Engine -> t_UI_State_Publish

### End-to-End Latency Metrics Comparison

| Pipeline Path | Processing Engine | Average Latency | P50 (Median) | P95 Latency | P99 Latency | Operational Bottleneck |
|---|---|---|---|---|---|---|
| **Gemini Path (Cloud)** | Vertex AI (Gemini 1.5 Flash) + RAG | **13421.4 ms** | **12685.6 ms** | **25776.7 ms** | **35275.3 ms** | Network RTT + Gemini LLM Inference |
| **Fallback Path (Local)** | Keyword Regex ('localFallbackAnalyzer') | **0.026 ms** | **0.019 ms** | **0.041 ms** | **0.210 ms** | Sub-millisecond synchronous JS |
| **Rule Engine Only** | Point-based scoring ('ruleEngine.ts') | **0.0062 ms** | **0.0005 ms** | **0.0204 ms** | **0.0986 ms** | Negligible CPU computation |

#### Key Latency Insights:
1. **Gemini Path Total Latency**: Ranging from **12685.6 ms** (P50) to **25776.7 ms** (P95) during active streaming calls, primarily composed of HTTP network transmission to Google Cloud Run and structured Gemini JSON entity extraction.
2. **Local Fallback Zero-Latency Advantage**: When Gemini retries exhaust or API quota is reached, switching to 'localFallbackAnalyzer' reduces total E2E processing time to **0.026 ms**, eliminating network latency completely.

---

## 📊 Side-by-Side Performance Comparison

### 1. Direct Rule Engine Scoring Mode (Instant Target Score)

| Test Set | Pipeline / Mode | Threshold | Precision | Recall | F1 Score | Accuracy | TP | FP | FN | TN |
|---|---|---|---|---|---|---|---|---|---|---|
| **Self-Authored (40)** | Full Pipeline (WITH RAG) | **MEDIUM** | 100.0% | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 20 |
| **Self-Authored (40)** | Full Pipeline (WITH RAG) | **HIGH** | 100.0% | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 20 |
| **Self-Authored (40)** | Full Pipeline (WITH RAG) | **CRITICAL** | 100.0% | 65.0% | 78.8% | 82.5% | 13 | 0 | 7 | 20 |
| **Self-Authored (40)** | Full Pipeline (NO RAG) | **MEDIUM** | 100.0% | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 20 |
| **Self-Authored (40)** | Full Pipeline (NO RAG) | **HIGH** | 100.0% | 80.0% | 88.9% | 90.0% | 16 | 0 | 4 | 20 |
| **Self-Authored (40)** | Full Pipeline (NO RAG) | **CRITICAL** | 100.0% | 60.0% | 75.0% | 80.0% | 12 | 0 | 8 | 20 |
| **Adversarial (32)** | Full Pipeline (WITH RAG) | **MEDIUM** | 100.0% | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 12 |
| **Adversarial (32)** | Full Pipeline (WITH RAG) | **HIGH** | 100.0% | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 12 |
| **Adversarial (32)** | Full Pipeline (WITH RAG) | **CRITICAL** | 100.0% | 70.0% | 82.4% | 81.3% | 14 | 0 | 6 | 12 |
| **Adversarial (32)** | Full Pipeline (NO RAG) | **MEDIUM** | 100.0% | 100.0% | 100.0% | 100.0% | 20 | 0 | 0 | 12 |
| **Adversarial (32)** | Full Pipeline (NO RAG) | **HIGH** | 100.0% | 90.0% | 94.7% | 93.8% | 18 | 0 | 2 | 12 |
| **Adversarial (32)** | Full Pipeline (NO RAG) | **CRITICAL** | 100.0% | 65.0% | 78.8% | 78.1% | 13 | 0 | 7 | 12 |
| **Adversarial (32)** | Local Fallback Alone | **MEDIUM** | 65.4% | 85.0% | 73.9% | 62.5% | 17 | 9 | 3 | 3 |
| **Adversarial (32)** | Local Fallback Alone | **HIGH** | 76.9% | 50.0% | 60.6% | 59.4% | 10 | 3 | 10 | 9 |
| **Adversarial (32)** | Local Fallback Alone | **CRITICAL** | 80.0% | 20.0% | 32.0% | 46.9% | 4 | 1 | 16 | 11 |

---

## 🧪 RAG Semantic Bonus: Ablation Analysis

> **How this works**: The `RuleEngine` adds a `semanticConfidence × 15` bonus (0–15 pts) from the Gemini RAG vector similarity search.
> This table compares Full Pipeline (WITH RAG bonus) vs. a stripped version (NO RAG bonus, `semanticConfidence=0`)
> to quantify RAG's **actual marginal contribution** to recall and F1.

| Threshold | Self-Authored Recall Δ (RAG vs No-RAG) | Self-Authored F1 Δ | Adversarial Recall Δ | Adversarial F1 Δ |
|---|---|---|---|---|
| **MEDIUM** | 0.0% | 0.0% | 0.0% | 0.0% |
| **HIGH** | +20.0% | +11.1% | +10.0% | +5.3% |
| **CRITICAL** | +5.0% | +3.8% | +5.0% | +3.6% |

#### Honest Assessment of RAG's Marginal Contribution:
- **RAG is a tie-breaker, not a primary classifier.** The core 8-rule engine (OTP=25pts, AUTH=20pts, CREDENTIAL=20pts, PAYMENT=20pts) is sufficient to cross MEDIUM (34%) and HIGH (60%) thresholds for most explicit scam scripts. The RAG bonus (0–15pts) primarily helps push borderline cases (e.g. score=75–85pts) across the CRITICAL (80%) threshold.
- **If recall delta = 0% at MEDIUM/HIGH**: RAG adds no recall on samples that already trigger core rules. The bonus points push scores higher within an already-predicted tier, increasing confidence margin but not changing the binary classification outcome.
- **If recall delta > 0% at CRITICAL**: RAG is actively helping by pushing borderline (score ~70–80pts) cases over 80%, converting them from HIGH to CRITICAL. This is its primary measurable value.
- **Bottom line**: RAG's contribution is **incremental, not transformative**. The honest position is that a well-tuned rule engine with explicit OTP/credential/payment rules already captures most fraud. RAG adds ~0–10% recall at CRITICAL threshold for samples that the rule engine alone scores just below the 80% boundary.

---

## 🔍 Honest Analysis of Performance Gap

1. **Self-Authored vs Adversarial Test Set Gap**:
   - On the self-authored set, the full pipeline achieved **100% precision and recall** at MEDIUM and HIGH thresholds.
   - On the adversarial test set, Full Pipeline recall at MEDIUM is **100.0%** and at HIGH is **100.0%**.
   - **Why the gap exists**: The self-authored samples included explicit indicators ('credentialRequest: true', 'otpMentioned: true'). In contrast, adversarial paraphrases (e.g. *"read back the six-digit confirmation number"*) rely on the LLM's semantic understanding to map to 'otpMentioned: true'. When evaluated via 'localFallbackAnalyzer' alone (without Gemini NLP), keyword matching misses paraphrases, resulting in lower recall (**85.0%** at MEDIUM, **50.0%** at HIGH).

2. **False Positive Resilience on Benign Mimics**:
   - Out of 10 benign adversarial samples (legitimate HDFC KYC branch visits, hospital card payments, Amazon deliveries, Airtel subscription reminders), **0 false positives** were triggered at HIGH or CRITICAL thresholds (100% Precision).
   - This validates that the 'RuleEngine' requirement of *malicious intent* (demanding credentials/transfer) successfully prevents over-zealous blocking on routine banking calls.

---

## 🚨 Known Limitation: CRITICAL Recall & Convergence Lag

### 1. Single-Chunk Rule Score Ceiling
In 'ruleEngine.ts', individual fraud rules contribute fixed point amounts ('OTP_REQUEST': 25, 'AUTH_IMPERSONATION': 20, 'CREDENTIAL_REQUEST': 20, 'PAYMENT_REQUEST': 20, 'URGENCY': 10, 'KNOWN_SCAM': 20).
- A call containing authority impersonation + payment demand triggers 'AUTH_IMPERSONATION' (20) + 'PAYMENT_REQUEST' (20) + 'HIGH_URGENCY' (10) + 'KNOWN_SCAM' (20) + 'MANIPULATION' (8) = **78 points** (Probability = **0.78**).
- **0.78 is below the 0.80 CRITICAL threshold**. Therefore, single-utterance fraud attempts without OTP or credential demands cap out in the **HIGH** threat level (60%–79%), resulting in only **70.0%** CRITICAL recall on single-chunk evaluations.

### 2. RiskEngine Adaptive Convergence Algorithm (Improved)

'RiskEngine.ts' smooths target confidence T = score / 100 using sustained high-risk streak tracking:
- **Base Rate**: rate = 0.25 + 0.50 * T
- **Spike Acceleration**: +0.20 when diff = T - P_k-1 > 0.40
- **Sustained High Confidence Acceleration**: +0.15 rate boost and +0.06 target shift when T >= 0.75 persists for 2+ consecutive chunks

#### Before vs After Convergence Lag Comparison (from baseline P0 = 0.05):

| Target Score ($S$) | Target ($T$) | Frames to CRITICAL (Before) | Frames to CRITICAL (After) | Frames to LOCKDOWN (Before) | Frames to LOCKDOWN (After) | Time to LOCKDOWN (After) |
|---|---|---|---|---|---|---|
| **80** | 0.80 | 7 frames (21.0s) | **5 frames (15.0s)** | Never | **Never** | Never |
| **85** | 0.85 | 2 frames (6.0s) | **2 frames (6.0s)** | Never | **Never** | Never |
| **90** | 0.90 | 1 frame (3.0s) | **1 frame (3.0s)** | Never | **3 frames (9.0s)** | **9.0s** |
| **95** | 0.95 | 1 frame (3.0s) | **1 frame (3.0s)** | 5 frames (15.0s) | **2 frames (6.0s)** | **6.0s** |
| **100** | 1.00 | 1 frame (3.0s) | **1 frame (3.0s)** | 1 frame (3.0s) | **1 frame (3.0s)** | **3.0s** |

#### False Positive Rate & Recall Impact:
- **False Positive Rate**: **0.0%** (0 false positives out of 30 total benign calls across both datasets before and after).
- **LOCKDOWN Lag Reduction**: Score 90 calls now successfully reach LOCKDOWN (0.95) within **3 chunks (9s)** instead of stalling indefinitely. Score 95 calls reach LOCKDOWN in **2 chunks (6s)** down from 5 chunks (15s).

---

## 📁 Dataset Inventory

- **Self-Authored Test Set**: 40 items ('SCAM': 20, 'BENIGN': 20) — located in 'scripts/benchmark.js'.
- **Adversarial Independent Test Set**: 32 items ('SCAM': 22, 'BENIGN': 10) — located in 'scripts/adversarial-test-set.json'.

*Report Generated: 2026-07-21T14:48:32.567Z*
