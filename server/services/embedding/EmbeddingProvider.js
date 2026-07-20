export class EmbeddingProvider {
    /**
     * Generate an embedding for the given text.
     * @param {string} text 
     * @returns {Promise<number[]>}
     */
    async embedText(text) {
        throw new Error('Method "embedText" must be implemented.');
    }
}
