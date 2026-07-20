/**
 * KnowledgeProvider — interface for any knowledge source.
 * Implementations can load from JSON files, PDFs, databases, or web APIs
 * without changing the RAGKnowledgeStore or RAGOrchestrator.
 */
export class KnowledgeProvider {
    /**
     * Load all knowledge entries from the source.
     * @returns {Promise<KnowledgeEntry[]>}
     */
    async loadEntries() {
        throw new Error('Method "loadEntries" must be implemented.');
    }
}
