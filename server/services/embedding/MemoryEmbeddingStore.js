import { EmbeddingStore } from './EmbeddingStore.js';

function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class MemoryEmbeddingStore extends EmbeddingStore {
    constructor() {
        super();
        this.records = []; // Array of { id, vector, metadata }
    }

    add(id, vector, metadata) {
        // Replace if exists
        const existingIdx = this.records.findIndex(r => r.id === id);
        if (existingIdx >= 0) {
            this.records[existingIdx] = { id, vector, metadata };
        } else {
            this.records.push({ id, vector, metadata });
        }
    }
    
    search(queryVector, topK = 5) {
        const results = this.records.map(record => {
            const similarity = cosineSimilarity(queryVector, record.vector);
            return {
                id: record.id,
                similarity,
                ...record.metadata
            };
        });

        // Sort descending by similarity
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, topK);
    }

    remove(id) {
        this.records = this.records.filter(r => r.id !== id);
    }

    clear() {
        this.records = [];
    }
}
