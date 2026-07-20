import { ragKnowledgeStore } from './RAGKnowledgeStore.js';
import { MemoryEmbeddingStore } from '../embedding/MemoryEmbeddingStore.js';

/**
 * RAGOrchestrator
 *
 * Retrieval-Augmented Generation engine for regulatory knowledge.
 *
 * Design principles:
 * - Reuses the EmbeddingOrchestrator singleton (Vertex → LocalSemantic fallback).
 *   No vector logic is duplicated.
 * - Maintains a separate MemoryEmbeddingStore for regulatory entries so the
 *   scam-signatures store is never polluted.
 * - Returns top-K regulatory passages with cosine similarity for prompt grounding.
 */
export class RAGOrchestrator {
    /**
     * @param {import('../embedding/EmbeddingOrchestrator.js').EmbeddingOrchestrator} embeddingOrchestrator
     */
    constructor(embeddingOrchestrator) {
        this.embeddingOrchestrator = embeddingOrchestrator;

        /** Dedicated store — separate from scam-signatures store */
        this.store = new MemoryEmbeddingStore();

        this.initialized = false;
        /** @type {Promise<void> | null} — prevents parallel init races */
        this.initPromise = null;
    }

    /**
     * Load and embed all regulatory entries.
     * Idempotent and race-safe.
     */
    async init() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit().finally(() => {
            // Clear initPromise only on failure so callers can retry
            if (!this.initialized) {
                this.initPromise = null;
            }
        });

        return this.initPromise;
    }

    async _doInit() {
        console.log('[RAGOrchestrator] Initializing regulatory knowledge embeddings...');

        await ragKnowledgeStore.load();
        const entries = ragKnowledgeStore.getAllEntries();

        for (const entry of entries) {
            // Combine title + excerpt for richer semantic signal
            const textToEmbed = `${entry.title}. ${entry.excerpt}`;
            const vector = await this.embeddingOrchestrator.getEmbedding(textToEmbed);

            this.store.add(entry.id, vector, {
                source: entry.source,
                title: entry.title,
                excerpt: entry.excerpt,
                url: entry.url,
                publicationDate: entry.publicationDate,
                tags: entry.tags
            });
        }

        this.initialized = true;
        console.log(`[RAGOrchestrator] Embedded ${entries.length} regulatory entries.`);
    }

    /**
     * Retrieve the top-K most relevant regulatory passages for the given transcript.
     *
     * @param {string}  transcript  Conversation text to ground.
     * @param {number}  topK        Number of citations to return (default 3).
     * @returns {Promise<RagCitation[]>}
     *
     * @typedef {Object} RagCitation
     * @property {string} id
     * @property {string} source             "RBI" | "CERT-In" | "NPCI"
     * @property {string} title
     * @property {string} excerpt
     * @property {number} similarity         0–1 cosine similarity
     * @property {string} displaySimilarity  Human-readable e.g. "87.3%"
     * @property {string} url                Official public URL
     * @property {string} publicationDate
     */
    async retrieveCitations(transcript, topK = 3) {
        if (!transcript || transcript.trim().length === 0) return [];

        await this.init();

        const queryVector = await this.embeddingOrchestrator.getEmbedding(transcript);
        const results = this.store.search(queryVector, topK);

        return results.map(r => ({
            id:                r.id,
            source:            r.source,
            title:             r.title,
            excerpt:           r.excerpt,
            similarity:        r.similarity,
            displaySimilarity: `${(r.similarity * 100).toFixed(1)}%`,
            url:               r.url,
            publicationDate:   r.publicationDate
        }));
    }
}

// ─── Lazy singleton ───────────────────────────────────────────────────────────
// We cannot import embeddingOrchestrator at module-evaluation time because it
// initialises on require.  We defer to first call.

/** @type {RAGOrchestrator | null} */
let _instance = null;

/**
 * Return (and lazily create) the shared RAGOrchestrator instance.
 * Designed to be called from route handlers, not at module load time.
 *
 * @returns {Promise<RAGOrchestrator>}
 */
export async function getRagOrchestrator() {
    if (!_instance) {
        const { embeddingOrchestrator } = await import('../embedding/EmbeddingOrchestrator.js');
        _instance = new RAGOrchestrator(embeddingOrchestrator);
        // Kick off background init — subsequent retrieveCitations() calls will await it
        _instance.init().catch(err =>
            console.error('[RAGOrchestrator] Background init failed:', err)
        );
    }
    return _instance;
}
