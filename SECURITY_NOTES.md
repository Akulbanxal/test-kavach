# Security & Cryptographic Integrity Notes — Kavach AI

> This document clarifies the technical scope, capabilities, and explicit non-goals of the cryptographic and AI components in Kavach AI.

---

## 1. SHA-256 Session Log Hash Chain

### What It Is
When an emergency fraud lockdown occurs, Kavach AI links all session event logs (transcript chunks, rule triggers, risk scores) into a **SHA-256 hash chain**:

$$\text{Block}_{i}.\text{hash} = \text{SHA256}(\text{Block}_{i}.\text{timestamp} + \text{Block}_{i}.\text{msg} + \text{Block}_{i}.\text{type} + \text{Block}_{i-1}.\text{hash})$$

The genesis block begins with `0000000000000000000000000000000000000000000000000000000000000000`.

### Scope & Protections
- **Detects Retroactive Modification**: If any entry in the log timeline is modified or deleted after generation, the hash chain validation breaks.
- **Audit Trail Integrity**: Guarantees chain-of-custody consistency for exportable PDF Investigation Reports.

### Non-Goals & Limitations
- **Client-Side Boundaries**: Because hashing occurs client-side within the browser JavaScript execution environment, it **cannot** protect against an attacker who controls the host OS or browser before the log entries are created.
- **Not Zero-Trust Machine Proof**: The hash chain proves internal log consistency, not that the host environment itself was uncompromised during call execution.

---

## 2. Local Fallback Analyzer Accuracy Disclosure

When the Gemini 1.5 Flash API is unreachable or retries exhaust, Kavach AI switches to `localFallbackAnalyzer.ts`.

### Expected Accuracy & Recall Gap
- **Gemini Path (Vertex AI)**:
  - Medium Risk Threshold (0.34): **100.0% Recall**
  - High Risk Threshold (0.60): **100.0% Recall**
  - Critical Risk Threshold (0.80): **70.0% Recall**
- **Local Fallback Path (Keyword Regex)**:
  - Medium Risk Threshold (0.34): **85.0% Recall** (-15.0% gap)
  - High Risk Threshold (0.60): **50.0% Recall** (-50.0% gap)
  - Critical Risk Threshold (0.80): **20.0% Recall** (-50.0% gap)

### Reduced Accuracy Mode UI Notice
Whenever the system transitions to `localFallbackAnalyzer.ts`, a persistent warning notice is displayed in the UI (**"Reduced Accuracy Mode: Local Fallback Active"**) to ensure users are aware of degraded detection capability.
