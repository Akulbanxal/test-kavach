import { GoogleAuth } from 'google-auth-library';
import { EmbeddingProvider } from './EmbeddingProvider.js';
import { config } from '../../config.js';

/**
 * VertexEmbeddingProvider
 *
 * Uses the Vertex AI Prediction REST API to generate text embeddings.
 * Configuration is sourced exclusively from the centralized config.js module —
 * which reads process.env exactly once, after Node's --env-file flag has
 * populated all environment variables before module evaluation begins.
 *
 * REST endpoint:
 *   POST https://{location}-aiplatform.googleapis.com/v1/projects/{project}
 *        /locations/{location}/publishers/google/models/{model}:predict
 */
export class VertexEmbeddingProvider extends EmbeddingProvider {
    constructor() {
        super();
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
    }

    /**
     * Call the Vertex AI text embedding prediction endpoint.
     * @param {string} text
     * @returns {Promise<number[]>} 768-dimensional embedding vector
     */
    async embedText(text) {
        // Configuration is read from the centralized config module.
        // config.js reads process.env at module-evaluation time, which is
        // guaranteed to be AFTER --env-file has loaded all variables.
        const project  = config.project;
        const location = config.location;
        const model    = config.embeddingModel;

        if (!project) {
            throw new Error(
                'EmbeddingProvider — ConfigurationError: GOOGLE_CLOUD_PROJECT is not set. ' +
                'Cannot construct Vertex AI endpoint URL.'
            );
        }

        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;

        // Single-line log for observability without flooding output
        console.log(`[VertexEmbeddingProvider] → ${project}/${location}/${model}`);

        const client = await this.auth.getClient();

        const data = {
            instances: [{ content: text }],
            parameters: { outputDimensionality: 768 }
        };

        let res;
        try {
            res = await client.request({ url, method: 'POST', data });
        } catch (err) {
            // Re-throw with full context so EmbeddingOrchestrator can log it
            throw new Error(
                `[VertexEmbeddingProvider] Request failed — ` +
                `Project: ${project} | Location: ${location} | Model: ${model} | ` +
                `Endpoint: ${url} | Auth: ADC | ` +
                `Error: ${err.message}`
            );
        }

        // Response shape: { predictions: [{ embeddings: { values: number[] } }] }
        const values = res.data?.predictions?.[0]?.embeddings?.values;
        if (!Array.isArray(values) || values.length === 0) {
            throw new Error(
                `[VertexEmbeddingProvider] Unexpected response shape — ` +
                `Project: ${project} | Model: ${model} | ` +
                `Response: ${JSON.stringify(res.data)}`
            );
        }
        return values;
    }
}
