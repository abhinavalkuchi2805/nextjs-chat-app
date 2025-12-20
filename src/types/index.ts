// Types for the Chat Application

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  stats?: StatsData;
  response?: string;
  matches?: SearchMatch[];
  totalFound?: number;
  method?: string;
}

export interface StatsData {
  totalRecords: number;
  byEventType: { [key: string]: number };
  uniqueDates: number;
  uniqueEmails: number;
  uniqueBrands: number;
  avgPrice: number;
  topSearchTerms?: Array<{ term: string; count: number }>;
  topPageViewCategories?: Array<{ category: string; count: number }>;
}

export interface SearchMatch {
  id: string;
  score: number;
  metadata: RecordMetadata;
}

export interface RecordMetadata {
  eventType: string;
  date: string;
  email?: string;
  sku?: string;
  quantity?: number;
  price?: number;
  productId?: string;
  productName?: string;
  brands?: string[];
  orderNumber?: string;
  country?: string;
  searchTerm?: string;
  url?: string;
  category?: string;
  subCategory?: string;
  productDescription?: string;
  productPrice?: string;
  productRating?: string;
  productReviews?: string;
  productAvailability?: string;
}

export interface ProcessedRecord {
  searchableText: string;
  metadata: RecordMetadata;
}

export interface CSVRecord {
  event_date: string;
  event_type: string;
  emailId?: string;
  atgId?: string;
  sotType?: string;
  sotV04?: string;
  sotV05?: string;
  sotV06?: string;
  sotV07?: string;
  sotV10?: string;
  sotV15?: string;
  sotV104?: string;
  sotV119?: string;
  sotV215?: string;
  url?: string;
  page_detail?: string;
  product_category?: string;
  product_sub_category?: string;
  product_name?: string;
  product_description?: string;
  product_price?: string;
  product_rating?: string;
  product_reviews?: string;
  product_availability?: string;
  product_url?: string;
  product_sku?: string;
  product_id?: string;
  product_brand?: string;
}

export interface QueryEntities {
  dates: string[];
  emails: string[];
  prices: string[];
  brands: string[];
  eventTypes: string[];
  searchTerms: string[];
}

export interface SearchResult {
  results: { matches: SearchMatch[] };
  method: string;
  filters: string[];
  requestedTopK: number;
}

export interface DatabaseHealth {
  healthy: boolean;
  stats?: {
    total_vectors: number;
    unique_event_types: number;
    unique_emails: number;
    earliest_date: string;
    latest_date: string;
  };
  error?: string;
  timestamp: string;
}
