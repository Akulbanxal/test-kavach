import { Router } from 'express';
import { inferenceOrchestrator } from '../services/InferenceOrchestrator.js';
import { getAnalyzePrompt } from '../prompts/analyzePrompt.js';
import { embeddingOrchestrator } from '../services/embedding/EmbeddingOrchestrator.js';
import { getRagOrchestrator } from '../services/rag/RAGOrchestrator.js';

const router = Router();

import { randomUUID } from 'crypto';

router.post('/analyze', async (req, res) => {
    const { chunk, previousContext } = req.body;
    const reqId = randomUUID().split('-')[0];
    const startTime = performance.now();

    if (!chunk || !chunk.text) {
        return res.status(400).json({ error: 'Missing chunk text in payload' });
    }

    console.log(`[REQ-${reqId}] Received chunk: "${chunk.text.substring(0, 50)}..."`);

    // ── Parallel retrieval: scam signatures + regulatory citations ─────────────
    let similarScams = [];
    let ragCitations = [];
    const retrieveStart = performance.now();

    try {
        const ragOrchestrator = await getRagOrchestrator();

        [similarScams, ragCitations] = await Promise.all([
            embeddingOrchestrator.searchSimilarScams(chunk.text, 3).catch(err => {
                console.error(`[REQ-${reqId}] Scam similarity search failed:`, err.message);
                return [];
            }),
            ragOrchestrator.retrieveCitations(chunk.text, 3).catch(err => {
                console.error(`[REQ-${reqId}] RAG citation retrieval failed:`, err.message);
                return [];
            })
        ]);
    } catch (e) {
        console.error(`[REQ-${reqId}] Retrieval stage failed:`, e.message);
    }

    const retrieveLatency = performance.now() - retrieveStart;

    // ── Build grounded prompt ─────────────────────────────────────────────────
    const payload = {
        transcript: chunk.text,
        timestamp: chunk.timestamp,
        previousContext: previousContext || ''
    };

    const promptText = getAnalyzePrompt(payload, similarScams, ragCitations);

    // ── LLM inference via InferenceOrchestrator ───────────────────────────────
    const llmStart = performance.now();
    try {
        const result = await inferenceOrchestrator.analyze(promptText, chunk.text, reqId);
        const llmLatency  = performance.now() - llmStart;
        const totalLatency = performance.now() - startTime;

        result.similarScams  = similarScams;
        result.ragCitations  = ragCitations;

        const h = inferenceOrchestrator.health();
        console.log(
            `[REQ-${reqId}] SUCCESS | provider=${h.inferenceProvider} model=${h.inferenceModel}` +
            ` | Latency: Total=${totalLatency.toFixed(1)}ms (Ret=${retrieveLatency.toFixed(1)}ms, LLM=${llmLatency.toFixed(1)}ms)` +
            ` | Category: ${result.scamCategory}`
        );
        res.json(result);
    } catch (error) {
        // InferenceOrchestrator only throws if both providers fail (should never happen)
        const totalLatency = performance.now() - startTime;
        console.error(`[REQ-${reqId}] FATAL — both inference providers failed after ${totalLatency.toFixed(1)}ms: ${error.message}`);
        res.status(500).json({ error: 'Inference unavailable. Please try again.' });
    }
});

export default router;
