# KavachAI Architecture

KavachAI is a real-time, privacy-first audio intelligence system designed to detect and block financial scams as they unfold during a voice call.

## System Overview
The system is divided into two major components:
- **Client (Frontend)**: React application displaying a live investigation dashboard and fraud confidence gauge.
- **Server (Backend)**: Express API handling audio stream processing, vector embedding, similarity matching, and LLM orchestration.

## Key Components

### 1. Audio Processing Pipeline
- **MockSpeechProvider**: Simulates real-time streaming audio (for hackathon/demo purposes) by emitting pre-recorded scam transcripts chunk by chunk.
- **Future State**: Connects to raw WebRTC streams, feeding into a transcription engine.

### 2. Risk Engine & Rules Layer
- An in-memory rules engine processes real-time attributes extracted from the text (e.g. `otpMentioned`, `urgencyLevel`, `credentialRequest`).
- Maintains state to lock the threat level to `CRITICAL` once probability exceeds 95%.

### 3. Retrieval-Augmented Generation (RAG)
To ground the AI and provide contextual evidence:
- **EmbeddingOrchestrator**: Computes 768-dimensional embeddings for transcripts. Uses `VertexEmbeddingProvider` (Google Cloud's text-embedding-004) and gracefully falls back to `LocalSemanticEmbeddingProvider` (deterministic keyword cosine similarity) if Google Cloud is offline.
- **RAGOrchestrator**: Uses the computed embeddings to retrieve the top regulatory citations (from RBI, CERT-In, and NPCI guidelines stored in `server/knowledge`) matching the ongoing scam topic.
- **Similar Scams**: Also searches `scam_signatures.json` to identify the vector footprint of the ongoing attack.

### 4. LLM Analysis
- **VertexProvider**: Connects to Vertex AI via `@google-cloud/vertexai`. Uses `gemini-1.5-pro` (or similar) to evaluate the conversation chunk, the extracted RAG context, and similar scam signatures to determine exact fraud classification and reasoning.
- **Local Fallback**: If the LLM call times out or fails (e.g. invalid ADC), the system seamlessly shifts to `LocalSemanticProvider` which applies deterministic rules and cached responses to ensure the dashboard continues functioning safely.

## Data Flow
1. Audio chunk transcribed → Sent to `POST /api/analyze`.
2. Backend computes embedding of chunk.
3. Vector similarity search retrieves matching scam patterns and regulatory citations in parallel.
4. Payload (chunk + context) sent to Vertex AI prompt.
5. Structured JSON response returned.
6. Frontend RiskEngine computes final risk probability.
7. Dashboard updates in real-time.
