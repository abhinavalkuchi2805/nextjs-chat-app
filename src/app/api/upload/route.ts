import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { getPool, formatVector, initDB, getClient } from '@/lib/db';
import { getEmbedding, eventProcessors, normalizeEventType } from '@/lib/embeddings';
import { CSVRecord, StatsData } from '@/types';

// In-memory stats cache
let statsCache: StatsData | null = null;

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initDB();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file content
    const content = await file.text();
    
    // Parse CSV
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVRecord[];

    console.log(`Parsed ${records.length} records from CSV`);

    // Process and upsert records
    const result = await processAndUpsert(records);

    return NextResponse.json({
      success: true,
      message: `Loaded ${records.length} records to PostgreSQL`,
      stats: result.stats,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processAndUpsert(results: CSVRecord[]): Promise<{ stats: StatsData }> {
  const BATCH_SIZE = 100;
  const PARALLEL_REQUESTS = 5;
  
  const statsData = {
    totalRecords: 0,
    byEventType: {} as Record<string, number>,
    uniqueDates: new Set<string>(),
    uniqueEmails: new Set<string>(),
    uniqueBrands: new Set<string>(),
    priceList: [] as number[],
    searchTerms: {} as Record<string, number>,
    pageViewCategories: {} as Record<string, number>,
  };

  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Split into batches
    const batches: CSVRecord[][] = [];
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      batches.push(results.slice(i, i + BATCH_SIZE));
    }

    let totalProcessed = 0;

    for (const batch of batches) {
      // Process chunks in parallel
      const chunks: CSVRecord[][] = [];
      for (let i = 0; i < batch.length; i += PARALLEL_REQUESTS) {
        chunks.push(batch.slice(i, i + PARALLEL_REQUESTS));
      }

      for (const chunk of chunks) {
        const embeddingPromises = chunk.map(async (record) => {
          const eventTypeFromData = record.event_type?.toLowerCase() || 'unknown';
          const eventType = normalizeEventType(eventTypeFromData);

          const processor = eventProcessors[eventType];
          if (!processor) {
            console.warn(`Unknown event type: ${eventType} for record:`, record);
            return null;
          }

          const { searchableText, metadata } = processor(record);
          
          try {
            const embedding = await getEmbedding(searchableText);
            
            if (!embedding || !Array.isArray(embedding)) {
              console.warn('Invalid embedding generated, skipping record');
              return null;
            }

            return {
              embedding,
              metadata,
              eventDate: record.event_date,
              eventType,
              email: metadata.email || ''
            };
          } catch (embeddingError) {
            console.error('Embedding generation error:', embeddingError);
            return null;
          }
        });

        const processedChunk = await Promise.all(embeddingPromises);
        const validRecords = processedChunk.filter(r => r !== null);

        if (validRecords.length > 0) {
          // Bulk insert
          const values = validRecords.map((_, idx) => {
            const base = idx * 5;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
          }).join(',');

          const params = validRecords.flatMap(r => [
            formatVector(r!.embedding),
            r!.metadata,
            r!.eventDate,
            r!.eventType,
            r!.email
          ]);

          const query = `
            INSERT INTO purchase_embeddings 
            (vector, metadata, event_date, event_type, email)
            VALUES ${values}
          `;
          
          await client.query(query, params);
          totalProcessed += validRecords.length;

          // Update stats
          validRecords.forEach(r => {
            if (!r) return;
            statsData.totalRecords++;
            statsData.byEventType[r.eventType] = (statsData.byEventType[r.eventType] || 0) + 1;
            statsData.uniqueDates.add(r.eventDate);
            if (r.email && r.email !== 'unknown@example.com') statsData.uniqueEmails.add(r.email);

            if (r.eventType === 'purchase') {
              if (r.metadata.brands) {
                r.metadata.brands.forEach((b) => statsData.uniqueBrands.add(b));
              }
              if (r.metadata.price) {
                statsData.priceList.push(r.metadata.price);
              }
            } else if (r.eventType === 'search' && r.metadata.searchTerm) {
              statsData.searchTerms[r.metadata.searchTerm] = (statsData.searchTerms[r.metadata.searchTerm] || 0) + 1;
            } else if (r.eventType === 'pageview' && r.metadata.subCategory) {
              statsData.pageViewCategories[r.metadata.subCategory] = (statsData.pageViewCategories[r.metadata.subCategory] || 0) + 1;
            }
          });
        }

        console.log(`Processed ${totalProcessed} records...`);
      }
    }

    await client.query('COMMIT');
    console.log(`Successfully upserted ${totalProcessed} vectors to PostgreSQL`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error upserting to PostgreSQL:', err);
    throw err;
  } finally {
    client.release();
  }

  // Compute final stats
  statsCache = {
    totalRecords: statsData.totalRecords,
    byEventType: statsData.byEventType,
    uniqueDates: statsData.uniqueDates.size,
    uniqueEmails: statsData.uniqueEmails.size,
    uniqueBrands: statsData.uniqueBrands.size,
    avgPrice: statsData.priceList.length > 0
      ? statsData.priceList.reduce((a, b) => a + b, 0) / statsData.priceList.length
      : 0,
    topSearchTerms: Object.entries(statsData.searchTerms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([term, count]) => ({ term, count })),
    topPageViewCategories: Object.entries(statsData.pageViewCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({ category, count })),
  };

  return { stats: statsCache };
}

// Export stats cache for stats endpoint
export function getStatsCache(): StatsData | null {
  return statsCache;
}
