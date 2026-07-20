# Demo Guide: KavachAI

Follow these steps to demonstrate the full capabilities of the KavachAI Scam Detection engine.

## Prerequisites
1. Frontend running on `http://localhost:5173`.
2. Backend API running on `http://localhost:3000`.

## Scenario 1: The Authority Scam (Digital Arrest)
**Goal:** Show how the system detects urgency and authority impersonation.

1. Open the dashboard.
2. In the bottom-right corner, open the "Mock Scenarios" menu.
3. Select **"Police / Arrest Scam"**.
4. **Talking Points:**
   - Notice the system transcribing in real-time.
   - The LLM instantly extracts attributes like `authorityDetected` and `urgencyLevel: High`.
   - The RAG system searches `scam_signatures.json` and identifies "Digital Arrest Fraud" as a vector match.
   - The Regulatory citations explicitly pull CERT-In and RBI guidelines disproving the scammer's claims (e.g. "Police do not conduct video arrests").

## Scenario 2: The UPI Scam
**Goal:** Show payment context and domain-specific regulatory grounding.

1. Click **"Reset Analysis"** at the top.
2. Select **"UPI / QR Scam"** from the mock menu.
3. **Talking Points:**
   - Watch the AI identify `paymentRequest`.
   - The RAG engine detects a UPI context and immediately retrieves NPCI's official guideline: *"You Never Need a UPI PIN to Receive Money"*.
   - The threat level locks to **CRITICAL**.

## Scenario 3: Local Fallback (No Internet)
**Goal:** Prove the system gracefully degrades without Google Cloud.

1. Stop the backend server.
2. Unset the `GOOGLE_CLOUD_PROJECT` environment variable (or disconnect the internet).
3. Restart the backend server.
4. Run the **"OTP / KYC Scam"** scenario.
5. **Talking Points:**
   - Point out the `⚠️ LOCAL FALLBACK` badge in the header.
   - Explain that despite Vertex AI being unreachable, the Local Semantic Engine successfully kicks in.
   - The dashboard updates, rules trigger, and risk is calculated entirely via offline heuristics and deterministic vector mapping.
