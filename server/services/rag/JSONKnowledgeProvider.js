import fs from 'fs';
import path from 'path';
import { KnowledgeProvider } from './KnowledgeProvider.js';

/**
 * JSONKnowledgeProvider — loads a regulatory knowledge base from a local JSON file.
 *
 * Each entry in the file must follow the schema:
 * {
 *   id, source, title, excerpt, url, publicationDate, tags[]
 * }
 */
export class JSONKnowledgeProvider extends KnowledgeProvider {
    /**
     * @param {string} filePath  Absolute path to the JSON knowledge file.
     */
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    async loadEntries() {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const entries = JSON.parse(raw);

        // Validate shape — warn and skip malformed entries so one bad entry
        // doesn't break the entire knowledge store.
        const valid = [];
        for (const entry of entries) {
            if (!entry.id || !entry.source || !entry.title || !entry.excerpt) {
                console.warn(
                    `[JSONKnowledgeProvider] Skipping malformed entry in ${path.basename(this.filePath)}:`,
                    JSON.stringify(entry).slice(0, 80)
                );
                continue;
            }
            valid.push({
                id: entry.id,
                source: entry.source,         // "RBI" | "CERT-In" | "NPCI"
                title: entry.title,
                excerpt: entry.excerpt,
                url: entry.url || '',
                publicationDate: entry.publicationDate || '',
                tags: Array.isArray(entry.tags) ? entry.tags : []
            });
        }

        return valid;
    }
}
