# Known Limitations & Future Work

While KavachAI demonstrates a fully functional real-time RAG pipeline and risk engine, the following are known limitations intended for future development:

1. **Audio Input Limitation:** 
   Currently, the application relies on `MockSpeechProvider` to simulate incoming transcripts. A production deployment will require integrating a WebRTC-based live transcription service (e.g. Google Cloud Speech-to-Text).

2. **Embedding Latency in Production:**
   While aggressive in-memory caching is implemented in `EmbeddingOrchestrator`, the first invocation for a totally novel sentence relies on the network call to Vertex AI. Future versions could integrate an edge-based smaller embedding model (like an ONNX exported model) to minimize zero-cache latency to near zero.

3. **Knowledge Base Size:**
   The `server/knowledge/` JSON files contain a curated subset (5 entries each) of regulatory guidelines to keep startup embedding times fast for demonstrations. A production system would ingest the full corpus and rely on a dedicated vector database (like Pinecone, Qdrant, or AlloyDB pgvector) rather than the `MemoryEmbeddingStore`.

4. **Multi-lingual Support:**
   The fallback deterministic rules and pre-cached keywords in `LocalSemanticProvider` are optimized for English. Hindi and regional languages would require localized semantic keywords or reliance exclusively on the multi-lingual LLM.

5. **Token Management:**
   While `auth.getClient().request` handles auto-refresh, extremely long-lived background processes might occasionally experience brief stutter during token exchange. A proactive token refresh loop could further smooth out latency.
