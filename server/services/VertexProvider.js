import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../config.js';

// ─── Error classification ───────────────────────────────────────────────────
export class AuthenticationError extends Error {
    constructor(message) { super(message); this.name = 'AuthenticationError'; }
}
export class ConfigurationError extends Error {
    constructor(message) { super(message); this.name = 'ConfigurationError'; }
}
export class QuotaError extends Error {
    constructor(message) { super(message); this.name = 'QuotaError'; }
}
export class NetworkError extends Error {
    constructor(message) { super(message); this.name = 'NetworkError'; }
}
export class PermissionError extends Error {
    constructor(message) { super(message); this.name = 'PermissionError'; }
}
export class ModelUnavailableError extends Error {
    constructor(message) { super(message); this.name = 'ModelUnavailableError'; }
}
export class UnexpectedError extends Error {
    constructor(message) { super(message); this.name = 'UnexpectedError'; }
}

/**
 * Classifies a raw Vertex AI / HTTP error into a typed error.
 * Only retryable errors (5xx, NetworkError) should be retried by the caller.
 * @param {Error} err
 * @returns {Error} A classified error instance
 */
export function classifyError(err) {
    const msg = err.message || '';

    if (msg.includes('401') || msg.toLowerCase().includes('unauthenticated')) {
        return new AuthenticationError(`Authentication failed: ${msg}`);
    }
    if (msg.includes('403') || msg.toLowerCase().includes('permission denied')) {
        return new PermissionError(`Permission denied: ${msg}`);
    }
    if (msg.includes('404') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('model unavailable')) {
        return new ModelUnavailableError(`Model not available: ${msg}`);
    }
    if (msg.includes('429') || msg.toLowerCase().includes('resource_exhausted') || msg.toLowerCase().includes('quota')) {
        return new QuotaError(`Quota exceeded: ${msg}`);
    }
    if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('econnrefused') ||
        msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('enotfound')) {
        return new NetworkError(`Network failure: ${msg}`);
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
        return new NetworkError(`Server-side error (retryable): ${msg}`);
    }
    return new UnexpectedError(`Unexpected Vertex AI error: ${msg}`);
}

/**
 * Whether an error is safe to retry (5xx / transient network failures only).
 * Never retry auth, permission, quota, or model errors.
 */
export function isRetryable(err) {
    return err instanceof NetworkError;
}

// ─── Retry with exponential backoff ────────────────────────────────────────
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 300;

async function withRetry(fn, label) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (rawErr) {
            const err = classifyError(rawErr);
            if (!isRetryable(err) || attempt >= MAX_RETRIES) throw err;
            const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 100);
            console.warn(`[VertexProvider] ${label} — retryable error (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms: ${err.message}`);
            await new Promise(r => setTimeout(r, delay));
            attempt++;
        }
    }
}

// ─── VertexProvider ─────────────────────────────────────────────────────────
export class VertexProvider {
    constructor() {
        this.initialized = false;
        this.initError = null;

        // Read exclusively from centralized config — no direct process.env access.
        this.project   = config.project;
        this.location  = config.location;
        this.modelName = config.geminiModel;

        if (!this.project) {
            this.initError = new ConfigurationError('GOOGLE_CLOUD_PROJECT is not set.');
            console.error('[VertexProvider] Configuration error:', this.initError.message);
            return;
        }
        if (!this.modelName) {
            this.initError = new ConfigurationError('GEMINI_MODEL is not set.');
            console.error('[VertexProvider] Configuration error:', this.initError.message);
            return;
        }

        console.log(`[VertexProvider] Initializing — project=${this.project} location=${this.location} model=${this.modelName}`);

        try {
            this.vertex = new VertexAI({ project: this.project, location: this.location });

            this.generativeModel = this.vertex.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            callerIntent:           { type: 'STRING' },
                            scamCategory:           { type: 'STRING', enum: ['Authority Impersonation', 'Bank Scam', 'Family Emergency', 'KYC Fraud', 'Investment Scam', 'Lottery Scam', 'Unknown'] },
                            emotionalTone:          { type: 'STRING' },
                            urgencyLevel:           { type: 'STRING' },
                            authorityDetected:      { type: 'BOOLEAN' },
                            credentialRequest:      { type: 'BOOLEAN' },
                            paymentRequest:         { type: 'BOOLEAN' },
                            otpMentioned:           { type: 'BOOLEAN' },
                            manipulationTechniques: { type: 'ARRAY', items: { type: 'STRING' } },
                            suspiciousClaims:       { type: 'ARRAY', items: { type: 'STRING' } },
                            conversationStage:      { type: 'STRING' },
                            summary:                { type: 'STRING' },
                            reasoning:              { type: 'STRING' }
                        },
                        required: [
                            'callerIntent', 'scamCategory', 'emotionalTone', 'urgencyLevel',
                            'authorityDetected', 'credentialRequest', 'paymentRequest',
                            'otpMentioned', 'manipulationTechniques', 'suspiciousClaims',
                            'conversationStage', 'summary', 'reasoning'
                        ]
                    }
                }
            });

            this.initialized = true;
            console.log(`[VertexProvider] Initialized successfully — model=${this.modelName}`);
        } catch (err) {
            this.initError = classifyError(err);
            console.error(
                `[VertexProvider] Initialization failed — project=${this.project} location=${this.location} model=${this.modelName} errorType=${this.initError.name} message=${this.initError.message}`
            );
        }
    }

    async analyzeChunk(promptText) {
        if (!this.initialized) {
            throw this.initError || new ConfigurationError('Vertex AI SDK not initialized.');
        }

        const request = {
            contents: [{ role: 'user', parts: [{ text: promptText }] }]
        };

        const response = await withRetry(
            () => this.generativeModel.generateContent(request),
            'analyzeChunk'
        );

        const rawText = response.response.candidates[0].content.parts[0].text;
        return this._validateResponse(rawText);
    }

    async checkHealth() {
        return { initialized: this.initialized, model: this.modelName, project: this.project, location: this.location };
    }

    _extractJson(text) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (match && match[1]) return match[1].trim();
        const firstBrace = text.indexOf('{');
        const lastBrace  = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            return text.substring(firstBrace, lastBrace + 1);
        }
        return text.trim();
    }

    _validateResponse(jsonString) {
        let parsed;
        try {
            parsed = JSON.parse(this._extractJson(jsonString));
        } catch (e) {
            console.error('[VertexProvider] JSON parsing failed:', e.message);
            throw new UnexpectedError('Failed to parse response from Vertex AI');
        }

        const validCategories = ['Authority Impersonation', 'Bank Scam', 'Family Emergency', 'KYC Fraud', 'Investment Scam', 'Lottery Scam', 'Unknown'];

        return {
            callerIntent:           typeof parsed?.callerIntent === 'string'               ? parsed.callerIntent           : 'Unknown',
            scamCategory:           validCategories.includes(parsed?.scamCategory)         ? parsed.scamCategory           : 'Unknown',
            emotionalTone:          typeof parsed?.emotionalTone === 'string'              ? parsed.emotionalTone          : 'Neutral',
            urgencyLevel:           typeof parsed?.urgencyLevel === 'string'               ? parsed.urgencyLevel           : 'Low',
            authorityDetected:      !!parsed?.authorityDetected,
            credentialRequest:      !!parsed?.credentialRequest,
            paymentRequest:         !!parsed?.paymentRequest,
            otpMentioned:           !!parsed?.otpMentioned,
            manipulationTechniques: Array.isArray(parsed?.manipulationTechniques)          ? parsed.manipulationTechniques : [],
            suspiciousClaims:       Array.isArray(parsed?.suspiciousClaims)                ? parsed.suspiciousClaims       : [],
            conversationStage:      typeof parsed?.conversationStage === 'string'          ? parsed.conversationStage      : 'Unknown',
            summary:                typeof parsed?.summary === 'string'                    ? parsed.summary                : '',
            reasoning:              typeof parsed?.reasoning === 'string'                  ? parsed.reasoning              : '',
            aiSource:               `Vertex AI (${this.modelName})`
        };
    }
}
