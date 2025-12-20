import { getPool, formatVector, logQuery } from './db';
import { getEmbedding, extractTopKFromQuery, extractBrand, scrambleEmail } from './embeddings';
import { SearchMatch, QueryEntities, SearchResult, RecordMetadata } from '@/types';
import { QueryResult } from 'pg';

// Query Preprocessor class
class QueryPreprocessor {
  private intentPatterns: Record<string, RegExp> = {
    aggregation: /how many|count|total|number of|sum|aggregate/i,
    ranking: /top|best|worst|highest|lowest|most|least|popular/i,
    temporal: /today|yesterday|last week|this month|between|before|after|recent/i,
    comparison: /compare|versus|vs|difference between/i,
    specific: /show me|find|get|what|who|when|list|display/i
  };

  private eventTypePatterns: Record<string, RegExp> = {
    purchase: /\b(buy|purchas|bought|order|ordered|product|price|expensive|cheap)\b/i,
    search: /\b(search|searched|query|look for|finding|seeking|looked for)\b/i,
    pageview: /\b(view|page|visit|browse|look at|seen)\b/i
  };

  detectIntent(query: string): string[] {
    const intents: string[] = [];
    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(query)) intents.push(intent);
    }
    return intents.length > 0 ? intents : ['semantic'];
  }

  detectEventTypeFromQuery(query: string): string[] {
    const queryLower = query.toLowerCase();
    const eventTypes: string[] = [];
    
    for (const [eventType, pattern] of Object.entries(this.eventTypePatterns)) {
      if (pattern.test(queryLower)) {
        eventTypes.push(eventType);
      }
    }
    
    return eventTypes;
  }

  extractDates(query: string): string[] {
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/g,
      /(today|yesterday)/gi,
      /(last week|this month|last month)/gi
    ];
    
    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = query.match(pattern);
      if (matches) dates.push(...matches);
    }
    return dates;
  }
  
  extractEmails(query: string): string[] {
    return query.match(/[\w.-]+@[\w.-]+\.[\w]+/g) || [];
  }
  
  extractPrices(query: string): string[] {
    return query.match(/\$\d+(?:\.\d{2})?|\d+\s*(?:dollars|usd)/gi) || [];
  }

  extractSearchTerms(query: string): string[] {
    const searchPatterns = [
      /search(?:ed|ing)?\s+(?:for\s+)?["']([^"']+)["']/i,
      /search(?:ed|ing)?\s+(?:for\s+)?(\w+)/i,
      /query\s+["']([^"']+)["']/i,
      /look(?:ing)?\s+for\s+["']([^"']+)["']/i
    ];
    
    const terms: string[] = [];
    for (const pattern of searchPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        terms.push(match[1]);
      }
    }
    return terms;
  }

  extractEntities(query: string): QueryEntities {
    return {
      dates: this.extractDates(query),
      emails: this.extractEmails(query),
      prices: this.extractPrices(query),
      brands: extractBrand(query) ? [extractBrand(query)!] : [],
      eventTypes: this.detectEventTypeFromQuery(query),
      searchTerms: this.extractSearchTerms(query),
    };
  }
}

// Convert database row to match format
function rowToMatch(row: Record<string, unknown>, allRows: Record<string, unknown>[]): SearchMatch {
  const metadata = row.metadata as RecordMetadata;
  const similarity = row.similarity as number;
  
  return {
    id: String(row.id),
    score: 1 - parseFloat(String(similarity || 0)),
    metadata: {
      ...metadata,
      email: metadata.email ? scrambleEmail(metadata.email) : undefined,
    },
  };
}

// Main query processing function
export async function processQuery(query: string, defaultTopK: number = 10): Promise<SearchResult> {
  const startTime = Date.now();
  
  try {
    const preprocessor = new QueryPreprocessor();
    
    const intents = preprocessor.detectIntent(query);
    const entities = preprocessor.extractEntities(query);
    
    const requestedTopK = extractTopKFromQuery(query);
    const finalTopK = requestedTopK || defaultTopK;
    
    console.log(`Query: "${query}" | Requested TopK: ${requestedTopK} | Final TopK: ${finalTopK}`);
    console.log(`Query intents: ${intents.join(', ')}, entities:`, entities);
    
    const result = await hybridSearch(query, intents, entities, finalTopK);
    
    const latency = Date.now() - startTime;
    await logQuery(query, result.results.matches.length, latency, result.method);
    
    return result;
  } catch (err) {
    const latency = Date.now() - startTime;
    await logQuery(query, 0, latency, 'error');
    throw err;
  }
}

// Hybrid search implementation
async function hybridSearch(
  query: string, 
  intents: string[], 
  entities: QueryEntities, 
  topK: number
): Promise<SearchResult> {
  let queryEmbedding: number[];
  
  try {
    queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      throw new Error('Invalid query embedding generated');
    }
    console.log('Generated query embedding with length:', queryEmbedding.length);
  } catch (err) {
    console.error('Error generating query embedding:', err);
    throw new Error('Failed to process query: ' + (err as Error).message);
  }

  // For search-related queries, force search event type
  const isSearchQuery = entities.eventTypes.includes('search') || 
                       query.toLowerCase().includes('search') ||
                       query.toLowerCase().includes('query');

  if (isSearchQuery && !entities.eventTypes.includes('search')) {
    entities.eventTypes.push('search');
  }

  // For purchase-related queries, force purchase event type
  const isPurchaseQuery = entities.eventTypes.includes('purchase') || 
                         query.toLowerCase().includes('purchase') ||
                         query.toLowerCase().includes('buy') ||
                         query.toLowerCase().includes('bought');

  if (isPurchaseQuery && !entities.eventTypes.includes('purchase')) {
    entities.eventTypes.push('purchase');
  }

  const semanticResults = await semanticSearch(queryEmbedding, entities, topK * 2);
  const rerankedResults = reRankResults(semanticResults.rows, query, topK);
  
  return {
    results: { 
      matches: rerankedResults.map(row => rowToMatch(row, rerankedResults)).slice(0, topK) 
    },
    method: 'hybrid-search',
    filters: Object.keys(entities).filter(k => {
      const value = entities[k as keyof QueryEntities];
      return Array.isArray(value) && value.length > 0;
    }),
    requestedTopK: topK,
  };
}

// Semantic search with PostgreSQL pgVector
async function semanticSearch(
  queryEmbedding: number[], 
  entities: QueryEntities, 
  limit: number
): Promise<QueryResult<Record<string, unknown>>> {
  const pool = getPool();
  const whereConditions: string[] = [];
  const params: (string | number | string[])[] = [formatVector(queryEmbedding), limit];
  let paramCount = 3;

  // Event type filter
  if (entities.eventTypes && entities.eventTypes.length > 0) {
    whereConditions.push(`event_type = ANY($${paramCount})`);
    params.push(entities.eventTypes);
    paramCount++;
  }

  // Date filter
  if (entities.dates && entities.dates.length > 0) {
    const exactDates = entities.dates.filter(d => /\d{4}-\d{2}-\d{2}/.test(d));
    if (exactDates.length > 0) {
      whereConditions.push(`event_date = ANY($${paramCount})`);
      params.push(exactDates);
      paramCount++;
    }
  }

  // Email filter
  if (entities.emails && entities.emails.length > 0) {
    whereConditions.push(`email = ANY($${paramCount})`);
    params.push(entities.emails);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const searchQuery = `
    SELECT *,
           vector <=> $1::vector as similarity
    FROM purchase_embeddings
    ${whereClause}
    ORDER BY similarity
    LIMIT $2
  `;

  console.log('Semantic search query:', searchQuery);
  console.log('Query parameters:', params.map((p, i) => i === 0 ? '[vector...]' : p));

  return pool.query(searchQuery, params);
}

// Re-rank results based on relevance
function reRankResults(
  rows: Record<string, unknown>[], 
  query: string, 
  topK: number
): Record<string, unknown>[] {
  const queryLower = query.toLowerCase();
  
  return rows
    .map(row => {
      let score = 1 - parseFloat(String(row.similarity || 0));
      const metadata = row.metadata as RecordMetadata;
      
      // Boost for price-related queries
      if ((queryLower.includes('expensive') || queryLower.includes('highest price')) && metadata.price) {
        score += (metadata.price / 1000) * 0.3;
      }
      
      if ((queryLower.includes('cheap') || queryLower.includes('lowest price')) && metadata.price) {
        score -= (metadata.price / 1000) * 0.3;
      }
      
      // Boost for search term matches
      if (metadata.searchTerm && queryLower.includes(metadata.searchTerm.toLowerCase())) {
        score += 0.2;
      }
      
      return { ...row, rerankedScore: Math.min(1.0, Math.max(0, score)) };
    })
    .sort((a, b) => (b.rerankedScore as number) - (a.rerankedScore as number))
    .slice(0, topK);
}

// Generate template-based response
export function generateResponse(query: string, vectorResults: SearchResult): string {
  const matches = vectorResults.results.matches || [];

  if (matches.length === 0) {
    return "No matches found. Try refining your query with dates, emails, event types, or specific terms.";
  }

  let response = '';

  // Group by event type
  const grouped = matches.reduce((acc: Record<string, SearchMatch[]>, match) => {
    const type = match.metadata.eventType || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(match);
    return acc;
  }, {});

  // Generate response based on event types
  Object.entries(grouped).forEach(([eventType, events]) => {
    response += `\n**${eventType.toUpperCase()} Events (${events.length}):**\n\n`;

    events.forEach((match, i) => {
      const m = match.metadata;
      response += `**${i + 1}.** ${m.date} | ${m.email || 'N/A'}\n`;

      if (eventType === 'purchase') {
        response += `   • Product: ${m.productName || 'N/A'}\n`;
        response += `   • SKU: ${m.sku || 'N/A'}\n`;
        response += `   • Price: $${m.price?.toFixed(2) || '0.00'}\n`;
        response += `   • Quantity: ${m.quantity || 0}\n`;
        response += `   • Brands: ${Array.isArray(m.brands) ? m.brands.join(', ') : 'N/A'}\n`;
        response += `   • Order: ${m.orderNumber || 'N/A'}\n`;
      } else if (eventType === 'pageview') {
        response += `   • Category: ${m.category || 'N/A'}\n`;
        response += `   • Sub Category: ${m.subCategory || 'N/A'}\n`;
        response += `   • URL: ${m.url || 'N/A'}\n`;
      } else if (eventType === 'search') {
        response += `   • Search Term: **${m.searchTerm || 'N/A'}**\n`;
        response += `   • URL: ${m.url || 'N/A'}\n`;
      }

      response += `   • Country: ${m.country || 'N/A'}\n\n`;
    });
  });

  return response;
}
