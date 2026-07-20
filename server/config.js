/**
 * config.js — Single source of truth for all KavachAI Vertex AI configuration.
 *
 * IMPORTANT: This module reads process.env directly.  It must only be
 * imported AFTER environment variables have been loaded.  When the server
 * is started with Node's --env-file flag (see package.json), env vars are
 * guaranteed to be populated before ANY module is evaluated, so this is safe.
 *
 * Every Vertex component (VertexProvider, VertexEmbeddingProvider, etc.)
 * imports from here.  No component ever calls process.env directly —
 * all configuration is centralized in this one place.
 */

// ── Read and validate required variables ────────────────────────────────────
const GOOGLE_CLOUD_PROJECT  = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION  || 'us-central1';
const GEMINI_MODEL          = process.env.GEMINI_MODEL;
const EMBEDDING_MODEL       = process.env.EMBEDDING_MODEL        || 'text-embedding-004';
const SIMILARITY_THRESHOLD  = parseFloat(process.env.SIMILARITY_THRESHOLD_PCT || '5');

// ── Validation ───────────────────────────────────────────────────────────────
const missingVars = [];
if (!GOOGLE_CLOUD_PROJECT) missingVars.push('GOOGLE_CLOUD_PROJECT');
if (!GEMINI_MODEL)         missingVars.push('GEMINI_MODEL');

export const configValid = missingVars.length === 0;

if (!configValid) {
    console.error(
        `[Config] CRITICAL — missing required environment variables: ${missingVars.join(', ')}.\n` +
        `[Config] Vertex AI providers will be unavailable. ` +
        `Server will run in Local Semantic fallback mode.`
    );
}

// ── Exported configuration object ────────────────────────────────────────────
export const config = {
    /** GCP project ID — e.g. kavachai-502820 */
    project:          GOOGLE_CLOUD_PROJECT  ?? null,

    /** Vertex AI region — e.g. us-central1 */
    location:         GOOGLE_CLOUD_LOCATION,

    /** Gemini model identifier — e.g. gemini-2.5-flash */
    geminiModel:      GEMINI_MODEL          ?? null,

    /** Text embedding model identifier — e.g. text-embedding-004 */
    embeddingModel:   EMBEDDING_MODEL,

    /** Minimum similarity % threshold for scam matching */
    similarityThreshold: SIMILARITY_THRESHOLD / 100,
    similarityThresholdPct: SIMILARITY_THRESHOLD,

    /** Whether all required config values are present */
    valid:            configValid,
};
