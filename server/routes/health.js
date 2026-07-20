import { Router } from 'express';
import { inferenceOrchestrator } from '../services/InferenceOrchestrator.js';
import { embeddingOrchestrator } from '../services/embedding/EmbeddingOrchestrator.js';

const router = Router();

// ── GET /health ──────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /health/vertex
 *
 * Returns a detailed health report for the Vertex AI integration.
 * Never exposes credentials or secrets.
 *
 * Response shape:
 * {
 *   authenticated,        // boolean
 *   project,              // string (GCP project ID from env)
 *   region,               // string
 *   inferenceProvider,    // 'VertexProvider' | 'LocalSemanticProvider'
 *   embeddingProvider,    // 'VertexEmbeddingProvider' | 'LocalSemanticEmbeddingProvider'
 *   inferenceModel,       // e.g. 'gemini-2.5-flash'
 *   embeddingModel,       // e.g. 'text-embedding-004'
 *   fallbackEnabled,      // always true
 *   fallbackActive,       // true if Vertex is unavailable and local is serving
 *   sdk,                  // SDK name
 *   status,               // 'healthy' | 'degraded' | 'unhealthy'
 *   vertexLatencyMs,      // null or number — latency of live LLM probe
 *   embeddingLatencyMs,   // null or number — latency of live embed probe
 *   fallbackCount,        // how many requests have used the fallback provider
 *   errors                // array of error details from each probe stage
 * }
 */
router.get('/vertex', async (req, res) => {
    await inferenceOrchestrator.initialize(); // idempotent

    const h = inferenceOrchestrator.health();
    const errors = [];

    // ── 1. ADC authentication check ───────────────────────────────────────────
    let authenticated = false;
    try {
        const { GoogleAuth } = await import('google-auth-library');
        const auth   = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const tokenRes = await client.getAccessToken();
        authenticated = !!(tokenRes && tokenRes.token);
    } catch (err) {
        errors.push({ stage: 'adc_auth', error: err.message });
    }

    // ── 2. Live Vertex inference probe ────────────────────────────────────────
    let vertexLatencyMs = null;
    let inferenceReachable = false;
    if (authenticated && h.vertexInitialized) {
        const probeStart = performance.now();
        try {
            // Import VertexProvider directly for the probe (does not affect the orchestrator state)
            const { VertexProvider } = await import('../services/VertexProvider.js');
            const probe = new VertexProvider();
            if (probe.initialized) {
                await probe.analyzeChunk(
                    'Health check probe. Reply with exactly: {"callerIntent":"test","scamCategory":"Unknown","emotionalTone":"Neutral","urgencyLevel":"Low","authorityDetected":false,"credentialRequest":false,"paymentRequest":false,"otpMentioned":false,"manipulationTechniques":[],"suspiciousClaims":[],"conversationStage":"Unknown","summary":"","reasoning":""}'
                );
                inferenceReachable = true;
            }
        } catch (err) {
            errors.push({ stage: 'vertex_probe', error: err.message });
        }
        vertexLatencyMs = parseFloat((performance.now() - probeStart).toFixed(1));
    }

    // ── 3. Live embedding probe ───────────────────────────────────────────────
    let embeddingLatencyMs = null;
    let embeddingProvider  = 'LocalSemanticEmbeddingProvider';
    let embeddingModel     = 'local-semantic-engine';
    if (authenticated) {
        const embStart = performance.now();
        try {
            const { VertexEmbeddingProvider } = await import('../services/embedding/VertexEmbeddingProvider.js');
            const embProbe = new VertexEmbeddingProvider();
            await embProbe.embedText('health probe');
            embeddingProvider = 'VertexEmbeddingProvider';
            embeddingModel    = process.env.EMBEDDING_MODEL || 'text-embedding-004';
        } catch (err) {
            const isQuota = err.message.includes('429') || err.message.toLowerCase().includes('quota');
            errors.push({
                stage:  'embedding_probe',
                error:  err.message,
                reason: isQuota ? 'RESOURCE_EXHAUSTED — using local fallback' : 'transient error — using local fallback'
            });
        }
        embeddingLatencyMs = parseFloat((performance.now() - embStart).toFixed(1));
    }

    // ── 4. Determine overall status ───────────────────────────────────────────
    let status;
    if (inferenceReachable) {
        status = 'healthy';
    } else if (authenticated) {
        status = 'degraded'; // auth works but LLM probe failed
    } else {
        status = 'unhealthy';
    }

    const report = {
        authenticated,
        project:           h.project,
        region:            h.region,
        inferenceProvider: inferenceReachable ? 'VertexProvider' : 'LocalSemanticProvider',
        embeddingProvider,
        inferenceModel:    h.inferenceModel,
        embeddingModel,
        fallbackEnabled:   true,
        fallbackActive:    !inferenceReachable,
        sdk:               '@google-cloud/vertexai',
        status,
        vertexLatencyMs,
        embeddingLatencyMs,
        fallbackCount:     h.fallbackCount,
        ...(errors.length > 0 ? { errors } : {})
    };

    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 207 : 503;
    res.status(httpStatus).json(report);
});

export default router;
