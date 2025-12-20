import { getPool, formatVector } from './db';
import { getEmbedding } from './embeddings';
import { RecordMetadata } from '@/types';

export interface VectorSearchResult {
    id: string;
    content: string;
    similarity: number;
    metadata: RecordMetadata;
}

/**
 * Search the vector database for similar documents
 * @param query The search query string
 * @param limit Maximum number of results to return (default: 5)
 * @returns Array of search results with similarity scores
 */
export async function searchVectorDB(query: string, limit: number = 5): Promise<VectorSearchResult[]> {
    try {
        // Generate embedding for the query
        const queryEmbedding = await getEmbedding(query);

        const pool = getPool();

        // Perform vector similarity search
        // operator <=> calculates cosine distance
        const searchQuery = `
      SELECT id, metadata, 1 - (vector <=> $1::vector) as similarity
      FROM purchase_embeddings
      ORDER BY vector <=> $1::vector
      LIMIT $2
    `;

        const result = await pool.query(searchQuery, [formatVector(queryEmbedding), limit]);

        return result.rows.map(row => ({
            id: String(row.id),
            content: reconstructContent(row.metadata),
            similarity: row.similarity,
            metadata: row.metadata as RecordMetadata
        }));
    } catch (error) {
        console.error('Vector search error:', error);
        throw error;
    }
}

/**
 * Reconstruct a readable content string from metadata
 * since we store the text in vector form but might want to display it
 */
function reconstructContent(metadata: RecordMetadata): string {
    const parts: string[] = [];

    if (metadata.date) parts.push(`Date: ${metadata.date}`);
    if (metadata.eventType) parts.push(`Type: ${metadata.eventType}`);

    if (metadata.eventType === 'purchase') {
        if (metadata.productName) parts.push(`Product: ${metadata.productName}`);
        if (metadata.price) parts.push(`Price: $${metadata.price}`);
        if (metadata.quantity) parts.push(`Qty: ${metadata.quantity}`);
        if (metadata.brands && metadata.brands.length > 0) parts.push(`Brands: ${metadata.brands.join(', ')}`);
    } else if (metadata.eventType === 'pageview') {
        if (metadata.productName) parts.push(`Viewed: ${metadata.productName}`);
        if (metadata.category) parts.push(`Category: ${metadata.category}`);
        if (metadata.url) parts.push(`URL: ${metadata.url}`);
    } else if (metadata.eventType === 'search') {
        if (metadata.searchTerm) parts.push(`Searched: "${metadata.searchTerm}"`);
    }

    if (metadata.country) parts.push(`Country: ${metadata.country}`);

    return parts.join(' | ');
}
