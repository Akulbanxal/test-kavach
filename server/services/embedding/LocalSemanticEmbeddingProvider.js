import { EmbeddingProvider } from './EmbeddingProvider.js';
import crypto from 'crypto';

export class LocalSemanticEmbeddingProvider extends EmbeddingProvider {
    async embedText(text) {
        // Deterministic mock embedding: 
        // We use a simple hash seeded approach to generate a 768-dim vector.
        // Similar texts (e.g. sharing exact words) won't have semantic similarity in this naive hash,
        // but it provides deterministic results for exact matching/caching.
        // Actually, to make it slightly semantic for demo without a real model:
        // We'll compute frequencies of common scam keywords and use that to weight the vector.
        
        const vector = new Array(768).fill(0);
        const lowerText = text.toLowerCase();
        
        const keywords = {
            'police': 0, 'warrant': 1, 'arrest': 2,
            'bank': 10, 'account': 11, 'suspended': 12, 'rbi': 13,
            'otp': 20, 'password': 21, 'kyc': 22,
            'family': 30, 'hospital': 31, 'accident': 32,
            'courier': 40, 'parcel': 41, 'customs': 42,
            'upi': 50, 'scan': 51, 'pin': 52,
            'investment': 60, 'crypto': 61, 'yield': 62,
            'tech': 70, 'support': 71, 'virus': 72,
            'lottery': 80, 'prize': 81, 'won': 82,
            'job': 90, 'hire': 91, 'salary': 92
        };

        let hasKeyword = false;
        for (const [word, idx] of Object.entries(keywords)) {
            if (lowerText.includes(word)) {
                vector[idx] = 1.0;
                hasKeyword = true;
            }
        }

        // If no keywords matched, just use a hash for the first 10 dims
        if (!hasKeyword) {
            const hash = crypto.createHash('md5').update(lowerText).digest('hex');
            for (let i = 0; i < 10; i++) {
                vector[i] = parseInt(hash.substring(i * 2, i * 2 + 2), 16) / 255.0;
            }
        }

        // Normalize vector
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
        return vector.map(v => v / magnitude);
    }
}
