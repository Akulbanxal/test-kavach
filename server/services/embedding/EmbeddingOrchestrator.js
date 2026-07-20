import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { config } from '../../config.js';
import { VertexEmbeddingProvider } from './VertexEmbeddingProvider.js';
import { LocalSemanticEmbeddingProvider } from './LocalSemanticEmbeddingProvider.js';
import { MemoryEmbeddingStore } from './MemoryEmbeddingStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EmbeddingOrchestrator {
    constructor() {
        this.store = new MemoryEmbeddingStore();
        
        // Use Vertex if not explicitly testing local semantic mode
        // For hackathon fallback, if GOOGLE_CLOUD_PROJECT isn't set properly, we might fail,
        // so we try Vertex, and if it fails, we fall back to LocalSemantic.
        this.provider = new VertexEmbeddingProvider();
        this.localProvider = new LocalSemanticEmbeddingProvider();

        this.embeddingCache = new Map(); // hash(text) -> vector[]
        
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        console.log('[EmbeddingOrchestrator] Initializing scam signatures library...');
        try {
            const signaturesPath = path.resolve(__dirname, '../../knowledge/scam_signatures.json');
            const data = fs.readFileSync(signaturesPath, 'utf8');
            const signatures = JSON.parse(data);

            for (const sig of signatures) {
                // Combine description and example transcript for richer semantic context
                const textToEmbed = `${sig.title}. ${sig.description} Example: ${sig.exampleTranscript}`;
                const vector = await this.getEmbedding(textToEmbed);
                
                this.store.add(sig.id, vector, {
                    title: sig.title,
                    category: sig.category,
                    description: sig.description,
                    recommendedAction: sig.recommendedAction
                });
            }
            
            this.initialized = true;
            console.log(`[EmbeddingOrchestrator] Loaded and embedded ${signatures.length} scam signatures.`);
        } catch (err) {
            console.error('[EmbeddingOrchestrator] Failed to initialize library:', err);
        }
    }

    async getEmbedding(text) {
        if (!text) return new Array(768).fill(0);
        
        const hash = crypto.createHash('md5').update(text).digest('hex');
        if (this.embeddingCache.has(hash)) {
            // console.log(`[EmbeddingOrchestrator] Cache HIT for "${text.substring(0, 30)}..."`);
            return this.embeddingCache.get(hash);
        }

        let vector;
        try {
            // Attempt Vertex
            vector = await this.provider.embedText(text);
            this.embeddingCache.set(hash, vector);
            return vector;
        } catch (e) {
            // Classify the error before deciding how to handle it
            const msg = e.message || '';
            const isQuota = msg.includes('429') || msg.toLowerCase().includes('resource_exhausted') || msg.toLowerCase().includes('quota');

            if (isQuota) {
                console.warn('[EmbeddingOrchestrator] Vertex embedding unavailable.\nUsing Local Embedding Provider.');
            } else {
                console.warn(`[EmbeddingOrchestrator] Vertex embedding failed (${e.name || 'Error'}): ${msg}.\nUsing Local Embedding Provider.`);
            }

            // Fallback to deterministic local semantic provider
            vector = await this.localProvider.embedText(text);
        }

        this.embeddingCache.set(hash, vector);
        return vector;
    }

    async searchSimilarScams(transcript, topK = 3) {
        await this.init(); // Ensure loaded
        
        if (!transcript) return [];
        
        const queryVector = await this.getEmbedding(transcript);
        const results = this.store.search(queryVector, topK);
        
        // Configurable threshold: label results below this similarity level.
        // Default 5%; override with SIMILARITY_THRESHOLD_PCT env var (e.g. "10" for 10%).
        const thresholdPct = config.similarityThresholdPct;
        const threshold = thresholdPct / 100;

        return results.map(r => {
            const belowThreshold = r.similarity < threshold;
            const displayPct = belowThreshold
                ? `<${thresholdPct}%`
                : `${(r.similarity * 100).toFixed(1)}%`;

            return {
                id: r.id,
                title: r.title,
                category: r.category,
                similarity: r.similarity,
                displaySimilarity: displayPct,
                belowThreshold,
                recommendedAction: r.recommendedAction,
                explanation: belowThreshold
                    ? `Weak signal — similarity below ${thresholdPct}% threshold for ${r.category}.`
                    : `Matches semantic footprint of ${r.category} tactics (Similarity: ${displayPct}).`
            };
        });
    }
}

export const embeddingOrchestrator = new EmbeddingOrchestrator();
