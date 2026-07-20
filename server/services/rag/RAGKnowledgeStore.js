import path from 'path';
import { fileURLToPath } from 'url';
import { JSONKnowledgeProvider } from './JSONKnowledgeProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWLEDGE_DIR = path.resolve(__dirname, '../../knowledge');

/**
 * RAGKnowledgeStore
 *
 * Aggregates multiple KnowledgeProviders, loads all entries into memory,
 * and exposes them ready for embedding and retrieval by the RAGOrchestrator.
 *
 * To add a new source (PDF, database, web) in the future:
 *   1. Implement a new KnowledgeProvider subclass.
 *   2. Pass it to RAGKnowledgeStore.addProvider().
 *   3. No changes required in RAGOrchestrator.
 */
export class RAGKnowledgeStore {
    constructor() {
        /** @type {import('./KnowledgeProvider.js').KnowledgeProvider[]} */
        this.providers = [];

        /** @type {Array<{id: string, source: string, title: string, excerpt: string, url: string, publicationDate: string, tags: string[]}>} */
        this.entries = [];

        this.loaded = false;
    }

    /**
     * Register a knowledge provider.
     * @param {import('./KnowledgeProvider.js').KnowledgeProvider} provider
     */
    addProvider(provider) {
        this.providers.push(provider);
    }

    /**
     * Load entries from all registered providers.
     * Idempotent — subsequent calls do nothing.
     */
    async load() {
        if (this.loaded) return;

        console.log('[RAGKnowledgeStore] Loading knowledge from all providers...');

        for (const provider of this.providers) {
            try {
                const entries = await provider.loadEntries();
                this.entries.push(...entries);
                console.log(`[RAGKnowledgeStore] Loaded ${entries.length} entries from ${provider.constructor.name}`);
            } catch (err) {
                console.error(`[RAGKnowledgeStore] Provider ${provider.constructor.name} failed to load:`, err.message);
            }
        }

        this.loaded = true;
        console.log(`[RAGKnowledgeStore] Total regulatory entries loaded: ${this.entries.length}`);
    }

    /**
     * Return all loaded entries.
     * @returns {Array}
     */
    getAllEntries() {
        return this.entries;
    }
}

// ─── Singleton: pre-configured with all three official knowledge files ────────

const rbiProvider    = new JSONKnowledgeProvider(path.join(KNOWLEDGE_DIR, 'rbi_guidelines.json'));
const certinProvider = new JSONKnowledgeProvider(path.join(KNOWLEDGE_DIR, 'certin_advisories.json'));
const npciProvider   = new JSONKnowledgeProvider(path.join(KNOWLEDGE_DIR, 'npci_guidelines.json'));

export const ragKnowledgeStore = new RAGKnowledgeStore();
ragKnowledgeStore.addProvider(rbiProvider);
ragKnowledgeStore.addProvider(certinProvider);
ragKnowledgeStore.addProvider(npciProvider);
