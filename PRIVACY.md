# Privacy Policy — Kavach AI

> **This is a hackathon demonstration project and is NOT a production-compliant system.**

---

## What Is Recorded

When you start a protected banking session in Kavach AI:

1. **Microphone audio** — captured via your browser's `getUserMedia` API. Audio is streamed in 250ms chunks as WEBM/Opus encoded binary data.
2. **Speech transcripts** — your microphone audio is sent to the backend server which transcribes it using **Google Cloud Speech-to-Text**.

---

## Where It Is Sent

| Data | Destination | Purpose |
|---|---|---|
| Raw audio chunks (WEBM/Opus) | Google Cloud Run backend (us-central1) | Google Cloud Speech-to-Text transcription |
| Speech transcripts | Google Cloud Run backend → Gemini 1.5 Flash API | Real-time fraud pattern analysis |
| Structured analysis results | Returned to your browser | Risk scoring and UI display |

---

## Data Retention

- **Audio**: Audio is streamed in real-time and **not stored** on any server. Each chunk is transcribed and discarded.
- **Transcripts**: Transcripts are processed in-flight by Gemini and **not persisted** in any database. The backend does not log transcripts to disk.
- **Analysis results**: Results (threat scores, triggered rules, reasoning) exist only in your browser's memory for the duration of the session and are cleared when you end the call.

---

## Forensic Hash Chain & Log Integrity

When a fraud lockdown is triggered, Kavach AI generates a **local, in-browser forensic log** with SHA-256 hash chaining. This log exists only in your browser memory and is included in the Investigation Report PDF you can download. It is **not transmitted** to any server.

### 🛡 Scope & Security Limitations of the Hash Chain:
- **What it DOES protect against**: Detects retroactive edits or deletion of log entries after they have been recorded in the session chain (each block incorporates the previous block's SHA-256 hash).
- **What it DOES NOT protect against**: Does not protect against a malicious operator who controls the client browser or device before entries are hashed, since all hashing is performed client-side in JS.
- **Purpose**: Provides chain-of-custody integrity for the session log audit trail, not cryptographic proof against a compromised host machine.

---

## Third-Party Services

This application uses:
- **Google Cloud Speech-to-Text** — subject to [Google Cloud Privacy Policy](https://cloud.google.com/terms/cloud-privacy-notice)
- **Google Gemini API** — subject to [Google AI Privacy Policy](https://ai.google.dev/gemini-api/terms)

---

## Hackathon Disclaimer

Kavach AI was built as a demonstration for a hackathon competition. It has **NOT** been audited for:
- GDPR / DPDPA compliance
- RBI or SEBI data handling regulations
- PCI-DSS or financial data security standards

**Do not use this application for real financial transactions or with sensitive personal information.**

---

## Contact

This project is maintained by Team De-GenZ.  
Repository: [github.com/swapnilyt1234/Kavach-AI](https://github.com/swapnilyt1234/Kavach-AI)

*Last updated: 2026-07-21*
