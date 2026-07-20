export class EmbeddingStore {
    add(id, vector, metadata) {
        throw new Error('Method "add" must be implemented.');
    }
    
    search(vector, topK = 5) {
        throw new Error('Method "search" must be implemented.');
    }

    remove(id) {
        throw new Error('Method "remove" must be implemented.');
    }

    clear() {
        throw new Error('Method "clear" must be implemented.');
    }
}
