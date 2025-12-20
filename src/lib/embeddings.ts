import { CSVRecord, ProcessedRecord, RecordMetadata } from '@/types';

// Ollama embedding generation
export async function getEmbedding(text: string): Promise<number[]> {
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/embeddings';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'nomic-embed-text';

  try {
    console.log('Generating embedding using Ollama...', text.substring(0, 50) + '...');

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Generated embedding with length:', data.embedding?.length || 0);
    return data.embedding;
  } catch (err) {
    console.error('Ollama Embedding error:', err);
    throw new Error(
      `Failed to generate embedding with ${OLLAMA_MODEL}. Is Ollama running?`
    );
  }
}

// Scramble email for privacy
export function scrambleEmail(email: string): string {
  const visibleChars = 4;
  const maskChar = '#';
  const minMaskLength = 3;
  
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    return email;
  }
  
  const charsToShow = Math.min(visibleChars, localPart.length);
  const visiblePart = localPart.substring(0, charsToShow);
  const maskLength = Math.max(minMaskLength, localPart.length - charsToShow);
  const maskedPart = maskChar.repeat(maskLength);

  return `${visiblePart}${maskedPart}@${domain}`;
}

// Event type normalization
export function normalizeEventType(raw: string): string {
  if (!raw) return 'unknown';
  const lowered = raw.toString().toLowerCase().trim();
  
  if (lowered === 'page view' || lowered === 'pageview') {
    return 'pageview';
  }
  if (lowered === 'purchase' || lowered === 'buy') {
    return 'purchase';
  }
  if (lowered === 'search' || lowered === 'query') {
    return 'search';
  }
  
  return lowered;
}

// Event processors for different event types
export const eventProcessors: Record<string, (record: CSVRecord) => ProcessedRecord> = {
  purchase: (record: CSVRecord): ProcessedRecord => {
    const brands = record.sotV07
      ? record.sotV07.split(';').map((b) => b.trim()).filter((b) => b)
      : [];

    const searchableText = `Purchase event on ${record.event_date} by ${
      scrambleEmail(record.emailId || '')
    }
Event Type: purchase
SKU: ${record.sotV04 || 'N/A'}
Product ID: ${record.sotV15 || 'N/A'}
Product Name: ${record.sotV215 || 'N/A'}
Brands: ${brands.join(', ')}
Quantity: ${record.sotV05 || 0}
Price: ${record.sotV06 || 'N/A'}
Order Number: ${record.sotV10 || 'N/A'}
Country: ${record.sotV119 || 'N/A'}`;

    const metadata: RecordMetadata = {
      eventType: 'purchase',
      date: record.event_date,
      email: scrambleEmail((record.emailId || '').toLowerCase()),
      sku: record.sotV04,
      quantity: parseInt(record.sotV05 || '0') || 0,
      price: parseFloat(record.sotV06?.replace(/[^0-9.]/g, '') || '0') || 0,
      productId: record.sotV15,
      productName: record.sotV215,
      brands: brands,
      orderNumber: record.sotV10,
      country: record.sotV119,
    };

    return { searchableText, metadata };
  },

  pageview: (record: CSVRecord): ProcessedRecord => {
    const searchableText = `Page View event on ${record.event_date}
Event Type: page view
Page Detail: ${record.page_detail || 'N/A'}
Product Category: ${record.product_category || 'N/A'}
Product Sub Category: ${record.product_sub_category || 'N/A'}
Product Name: ${record.product_name || 'N/A'}
Product Description: ${record.product_description || 'N/A'}
Product Price: ${record.product_price || 'N/A'}
Product Rating: ${record.product_rating || 'N/A'}
Product Reviews: ${record.product_reviews || 'N/A'}
Product Availability: ${record.product_availability || 'N/A'}`;

    const metadata: RecordMetadata = {
      eventType: 'pageview',
      date: record.event_date,
      url: record.product_url || record.page_detail,
      category: record.product_category,
      subCategory: record.product_sub_category,
      productName: record.product_name,
      productDescription: record.product_description,
      productPrice: record.product_price,
      productRating: record.product_rating,
      productReviews: record.product_reviews,
      productAvailability: record.product_availability,
    };

    return { searchableText, metadata };
  },

  search: (record: CSVRecord): ProcessedRecord => {
    const searchableText = `Search event on ${record.event_date} by ${
      scrambleEmail(record.emailId || '')
    }
Event Type: search
Search Term: ${record.sotV104 || 'N/A'}
URL: ${record.url || 'N/A'}
Country: ${record.sotV119 || 'N/A'}`;

    const metadata: RecordMetadata = {
      eventType: 'search',
      date: record.event_date,
      email: scrambleEmail((record.emailId || '').toLowerCase()),
      searchTerm: record.sotV104,
      url: record.url,
      country: record.sotV119,
    };

    return { searchableText, metadata };
  },
};

// Extract top K from query
export function extractTopKFromQuery(query: string): number | null {
  const queryLower = query.toLowerCase();
  
  const topKPatterns = [
    /top\s+(\d+)/,
    /(\d+)\s+most/,
    /(\d+)\s+top/,
    /first\s+(\d+)/,
    /show\s+me\s+(\d+)/,
    /get\s+me\s+(\d+)/,
    /find\s+(\d+)/,
    /(\d+)\s+(?:results?|records?|items?)/
  ];
  
  for (const pattern of topKPatterns) {
    const match = queryLower.match(pattern);
    if (match && match[1]) {
      const k = parseInt(match[1]);
      if (!isNaN(k) && k > 0) {
        console.log(`Extracted top K: ${k} from query: "${query}"`);
        return k;
      }
    }
  }
  
  if (queryLower.includes('top') && !queryLower.match(/\d+/)) {
    return 5;
  }
  
  return null;
}

// Extract brand from query
export function extractBrand(query: string): string | null {
  const knownBrands = [
    'sephora collection',
    'yves saint laurent',
    'nars',
    'fenty',
    'rare beauty',
    'dior',
    'lancome',
    'mac',
  ];

  for (const b of knownBrands) {
    if (query.toLowerCase().includes(b.toLowerCase())) return b;
  }
  return null;
}
