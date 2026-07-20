/**
 * index.js — KavachAI backend entry point.
 *
 * Environment variable loading:
 *   Handled by Node's --env-file flag in package.json scripts:
 *     node --env-file=../.env index.js
 *   This guarantees env vars are populated BEFORE any module is evaluated,
 *   including module-level singletons (embeddingOrchestrator, etc.).
 *   dotenv is intentionally NOT used here — --env-file is the correct ESM solution.
 */

import express from 'express';
import cors from 'cors';
import { config, configValid } from './config.js';

// ─── Startup configuration validation ────────────────────────────────────────
function validateConfig() {
    if (!configValid) {
        console.warn('[Config] Server will start in degraded mode using Local Semantic Engine.');
    }
    return configValid;
}

// ─── Startup diagnostics ─────────────────────────────────────────────────────
async function printStartupDiagnostics(isConfigValid) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              KavachAI — Startup Diagnostics              ║');
    console.log('╠══════════════════════════════════════════════════════════╣');

    // ── Configuration ────────────────────────────────────────────────────────
    const project    = config.project   ?? '(not set — DEGRADED)';
    const location   = config.location  ?? '(not set)';
    const gemModel   = config.geminiModel    ?? '(not set — DEGRADED)';
    const embModel   = config.embeddingModel ?? '(not set)';

    console.log(`║  Inference Project  : ${project.padEnd(34)} ║`);
    console.log(`║  Embedding Project  : ${project.padEnd(34)} ║`);   // SAME source — config.project
    console.log(`║  Region             : ${location.padEnd(34)} ║`);
    console.log(`║  Inference Model    : ${gemModel.padEnd(34)} ║`);
    console.log(`║  Embedding Model    : ${embModel.padEnd(34)} ║`);
    console.log(`║  Config Valid       : ${String(isConfigValid).padEnd(34)} ║`);
    console.log(`║  Fallback           : enabled (always on)                ║`);

    // ── ADC authentication probe ─────────────────────────────────────────────
    let adcStatus = 'unknown';
    try {
        const { GoogleAuth } = await import('google-auth-library');
        const auth   = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
        const client = await auth.getClient();
        const tok    = await client.getAccessToken();
        adcStatus = tok?.token ? 'authenticated ✓' : 'no token returned';
    } catch (e) {
        adcStatus = `failed — ${e.message.substring(0, 30)}`;
    }
    console.log(`║  ADC Auth           : ${adcStatus.substring(0, 34).padEnd(34)} ║`);

    // ── Inference orchestrator ────────────────────────────────────────────────
    const { inferenceOrchestrator } = await import('./services/InferenceOrchestrator.js');
    await inferenceOrchestrator.initialize();
    const h = inferenceOrchestrator.health();

    console.log(`║  Inference Provider : ${h.inferenceProvider.padEnd(34)} ║`);
    console.log(`║  Inference Active   : ${String(!h.fallbackActive).padEnd(34)} ║`);
    console.log(`║  Fallback Active    : ${String(h.fallbackActive).padEnd(34)} ║`);
    if (h.fallbackActive && h.fallbackReason) {
        const reason = h.fallbackReason.substring(0, 34);
        console.log(`║  Fallback Reason    : ${reason.padEnd(34)} ║`);
    }
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
}

// ─── Express application ─────────────────────────────────────────────────────
import analyzeRouter from './routes/analyze.js';
import healthRouter  from './routes/health.js';
import { setupSpeechSocket } from './routes/speechSocket.js';

const app  = express();
const port = config.valid ? (process.env.PORT || 3000) : (process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api',    analyzeRouter);

// ─── Server startup ──────────────────────────────────────────────────────────
const isConfigValid = validateConfig();

printStartupDiagnostics(isConfigValid).catch(err => {
    console.error('[Startup] Diagnostics failed (non-fatal):', err.message);
});

const server = app.listen(port, () => {
    console.log(`[Server] Listening on port ${port}`);
});

setupSpeechSocket(server);
