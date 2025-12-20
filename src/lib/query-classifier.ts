// Query classifier to determine if a query needs vector search (RAG) or general chat

export type QueryType = 'rag' | 'general';

export interface QueryClassification {
  type: QueryType;
  confidence: number;
  reason: string;
}

// Keywords that indicate the query is about uploaded/stored data (needs RAG)
const RAG_KEYWORDS = [
  // Data-related
  'show', 'display', 'list', 'find', 'search', 'get', 'fetch',
  'purchases', 'orders', 'transactions', 'sales',
  'page views', 'pageviews', 'views', 'visits',
  'searches', 'search terms', 'queries',
  'products', 'items', 'catalog',
  'users', 'customers', 'clients',
  'data', 'records', 'entries',
  
  // Analytics
  'top', 'best', 'worst', 'most', 'least', 'highest', 'lowest',
  'average', 'total', 'count', 'sum', 'statistics', 'stats',
  'last week', 'last month', 'yesterday', 'today', 'recent',
  'between', 'from date', 'to date',
  
  // Specific to e-commerce data
  'bought', 'purchased', 'ordered', 'viewed', 'searched for',
  'price', 'cost', 'amount', 'spent',
  'category', 'brand', 'department',
  'uploaded', 'csv', 'file', 'imported'
];

// Keywords that indicate general conversation (no RAG needed)
const GENERAL_KEYWORDS = [
  // General knowledge
  'what is', 'what are', 'who is', 'who are', 'when was', 'when did',
  'how does', 'how do', 'how to', 'how can',
  'why is', 'why do', 'why are',
  'explain', 'describe', 'tell me about', 'define',
  
  // Assistance
  'help me', 'can you', 'could you', 'would you',
  'write', 'create', 'generate', 'compose',
  'summarize', 'translate', 'convert',
  
  // Opinions/discussion
  'think', 'opinion', 'believe', 'feel',
  'recommend', 'suggest', 'advice',
  
  // Greetings/meta
  'hello', 'hi', 'hey', 'thanks', 'thank you',
  'who are you', 'what can you do'
];

// Patterns that strongly indicate RAG queries
const RAG_PATTERNS = [
  /show\s+(me\s+)?(all\s+)?/i,
  /list\s+(all\s+)?/i,
  /find\s+(all\s+)?/i,
  /get\s+(me\s+)?/i,
  /top\s+\d+/i,
  /last\s+(week|month|day|year)/i,
  /from\s+\d{4}/i,
  /purchases?\s+(from|by|of)/i,
  /search(es)?\s+(for|by|from)/i,
  /page\s*views?\s+(for|of|on|from)/i,
  /how\s+many\s+(purchases?|orders?|views?|searches?)/i,
  /what\s+did\s+(users?|customers?|people)\s+(buy|search|view|purchase)/i,
];

// Patterns that strongly indicate general queries
const GENERAL_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you)/i,
  /what\s+is\s+(a|an|the)?\s*\w+\s*\?$/i,
  /how\s+(does|do)\s+\w+\s+work/i,
  /explain\s+(to\s+me\s+)?/i,
  /tell\s+me\s+(about|more)/i,
  /can\s+you\s+(help|explain|tell|write)/i,
  /who\s+(is|are|was|were)/i,
];

/**
 * Classify a query to determine if it needs vector search (RAG) or general chat
 */
export function classifyQuery(query: string): QueryClassification {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check for strong RAG patterns
  for (const pattern of RAG_PATTERNS) {
    if (pattern.test(lowerQuery)) {
      return {
        type: 'rag',
        confidence: 0.9,
        reason: 'Query matches data retrieval pattern'
      };
    }
  }

  // Check for strong general patterns
  for (const pattern of GENERAL_PATTERNS) {
    if (pattern.test(lowerQuery)) {
      return {
        type: 'general',
        confidence: 0.9,
        reason: 'Query matches general conversation pattern'
      };
    }
  }

  // Count keyword matches
  let ragScore = 0;
  let generalScore = 0;

  for (const keyword of RAG_KEYWORDS) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      ragScore += 1;
    }
  }

  for (const keyword of GENERAL_KEYWORDS) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      generalScore += 1;
    }
  }

  // Determine type based on scores
  const totalScore = ragScore + generalScore;
  
  if (totalScore === 0) {
    // No clear indicators, default to general
    return {
      type: 'general',
      confidence: 0.5,
      reason: 'No clear data or general indicators found'
    };
  }

  const ragRatio = ragScore / totalScore;
  
  if (ragRatio > 0.6) {
    return {
      type: 'rag',
      confidence: Math.min(0.5 + ragRatio * 0.4, 0.95),
      reason: 'Query contains data-related keywords'
    };
  } else if (ragRatio < 0.4) {
    return {
      type: 'general',
      confidence: Math.min(0.5 + (1 - ragRatio) * 0.4, 0.95),
      reason: 'Query contains general conversation keywords'
    };
  } else {
    // Mixed signals, lean towards RAG if any data keywords are present
    return {
      type: ragScore > 0 ? 'rag' : 'general',
      confidence: 0.6,
      reason: 'Mixed indicators, using best guess'
    };
  }
}

/**
 * Check if the system has data loaded (to help decide RAG vs general)
 */
export function shouldUseRAG(query: string, hasDataLoaded: boolean): boolean {
  const classification = classifyQuery(query);
  
  // If no data loaded, always use general chat
  if (!hasDataLoaded) {
    return false;
  }
  
  // Use classification result
  return classification.type === 'rag';
}
