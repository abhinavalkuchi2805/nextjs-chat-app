import { Pool, PoolClient } from 'pg';

// PostgreSQL connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  return pool;
}

// Initialize database with pgVector extension and tables
export async function initDB(): Promise<void> {
  const pool = getPool();

  try {
    await pool.query('SELECT 1');

    // Enable pgvector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Create users table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create sessions table for managing user sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create conversations table for chat history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create messages table for conversation messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create main table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_embeddings (
        id SERIAL PRIMARY KEY,
        vector VECTOR(768),
        metadata JSONB,
        event_date DATE,
        event_type VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);


    // Create query logs table for analytics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS query_logs (
        id SERIAL PRIMARY KEY,
        query TEXT,
        result_count INTEGER,
        latency_ms INTEGER,
        method VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create optimized indexes
    await createOptimizedIndexes(pool);

    console.log('PostgreSQL connected and initialized successfully');
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}


async function createOptimizedIndexes(pool: Pool): Promise<void> {
  const indexQueries = [
    // Auth table indexes
    `CREATE INDEX IF NOT EXISTS idx_users_email 
     ON users(email)`,

    `CREATE INDEX IF NOT EXISTS idx_sessions_token 
     ON sessions(token)`,

    `CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
     ON sessions(user_id)`,

    `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at 
     ON sessions(expires_at)`,

    // Chat history indexes
    `CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
     ON conversations(user_id)`,

    `CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
     ON conversations(updated_at DESC)`,

    `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
     ON messages(conversation_id)`,

    `CREATE INDEX IF NOT EXISTS idx_messages_created_at 
     ON messages(created_at)`,

    // Vector similarity index
    // Drop old IVFFlat index if it exists (for migration)
    `DROP INDEX IF EXISTS idx_purchase_embeddings_vector`,

    // Vector similarity index (HNSW for better recall/performance)
    `CREATE INDEX IF NOT EXISTS idx_purchase_embeddings_hnsw 
     ON purchase_embeddings USING hnsw (vector vector_cosine_ops)`,

    // Composite index for common filters
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_embeddings_composite 
     ON purchase_embeddings(event_type, event_date DESC)`,

    // GIN indexes for JSONB queries
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metadata_brands 
     ON purchase_embeddings USING gin((metadata->'brands'))`,
  ];

  for (const query of indexQueries) {
    try {
      await pool.query(query);
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`Index creation warning: ${error.message}`);
    }
  }
}

// Check database health
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  stats?: {
    total_vectors: string;
    unique_event_types: string;
    unique_emails: string;
    earliest_date: string;
    latest_date: string;
  };
  error?: string;
  timestamp: string;
}> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_vectors,
        COUNT(DISTINCT event_type) as unique_event_types,
        COUNT(DISTINCT email) as unique_emails,
        MIN(event_date) as earliest_date,
        MAX(event_date) as latest_date
      FROM purchase_embeddings
    `);

    return {
      healthy: true,
      stats: result.rows[0],
      timestamp: new Date().toISOString()
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Clear database
export async function clearDatabase(mode: 'all' | 'cache' = 'all'): Promise<void> {
  const pool = getPool();
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    if (mode === 'all') {
      await client.query('TRUNCATE TABLE purchase_embeddings RESTART IDENTITY');
      await client.query('TRUNCATE TABLE query_logs RESTART IDENTITY');
      console.log('Cleared all data from PostgreSQL');
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Helper function to format array as PostgreSQL vector string
export function formatVector(array: number[]): string {
  if (!Array.isArray(array)) {
    throw new Error('Input must be an array');
  }
  return `[${array.join(',')}]`;
}

// Get database client for transactions
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

// Log query for analytics
export async function logQuery(
  query: string,
  resultCount: number,
  latencyMs: number,
  method: string
): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(`
      INSERT INTO query_logs (query, result_count, latency_ms, method, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
    `, [query.substring(0, 500), resultCount, latencyMs, method]);
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('Failed to log query analytics:', error.message);
  }
}
