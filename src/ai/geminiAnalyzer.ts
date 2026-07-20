import { TranscriptChunk, GeminiInferenceResponse } from './aiTypes';
import { API_URL } from '../config/api';

export class GeminiAnalyzer {
    private transcriptBuffer: TranscriptChunk[] = [];
    private maxRetries = 3;

    constructor() {
        console.log('[GeminiAnalyzer] Initialized. Communicating with backend API.');
    }

    public async analyzeStream(chunk: TranscriptChunk): Promise<GeminiInferenceResponse | null> {
        if (!chunk.isFinal && chunk.text === '...') {
            return null; // Ignore ambient noise chunks
        }

        const previousContext = this.transcriptBuffer.map(c => c.text).join(' ');
        this.transcriptBuffer.push(chunk);

        if (this.transcriptBuffer.length > 20) {
            this.transcriptBuffer.shift(); // Keep context bounded
        }

        let attempt = 0;

        while (attempt < this.maxRetries) {
            attempt++;
            try {
                const response = await fetch(`${API_URL}/api/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chunk, previousContext })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: GeminiInferenceResponse = await response.json();

                const sims = data.similarScams ?? [];
                let semanticConfidence = 0;
                if (sims.length > 0) {
                    const weights = [0.70, 0.20, 0.10];
                    let totalWeight = 0;
                    let weightedSum = 0;
                    for (let i = 0; i < Math.min(sims.length, weights.length); i++) {
                        weightedSum += (sims[i].similarity || 0) * weights[i];
                        totalWeight += weights[i];
                    }
                    if (totalWeight > 0) {
                        semanticConfidence = weightedSum / totalWeight;
                    }
                }
                data.semanticConfidence = semanticConfidence;

                console.log("========== GEMINI RESPONSE ==========");
                console.log(JSON.stringify(data, null, 2));
                console.log("=====================================");

                return data;

            } catch (error: any) {
                console.warn(`[GeminiAnalyzer] Attempt ${attempt} failed:`, error);

                if (attempt >= this.maxRetries) {
                    console.error(`[GeminiAnalyzer] Max retries reached. Returning default.`);
                    return this.getSafeDefault();
                }

                const delay = 500 * Math.pow(2, attempt - 1);
                await new Promise(res => setTimeout(res, delay));
            }
        }

        return this.getSafeDefault();
    }

    private getSafeDefault(): GeminiInferenceResponse {
        return {
            callerIntent: 'Unknown',
            scamCategory: 'Unknown',
            emotionalTone: 'Neutral',
            urgencyLevel: 'Low',
            authorityDetected: false,
            credentialRequest: false,
            paymentRequest: false,
            otpMentioned: false,
            manipulationTechniques: [],
            suspiciousClaims: [],
            conversationStage: 'Unknown',
            summary: '',
            reasoning: ''
        };
    }

    public reset() {
        this.transcriptBuffer = [];
        console.log('[GeminiAnalyzer] Buffer cleared.');
    }
}
