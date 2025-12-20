import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getPool();
    
    // Get stats from database
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT event_type) as unique_event_types,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(DISTINCT event_date) as unique_dates
      FROM purchase_embeddings
    `);

    const stats = result.rows[0];

    // Get event type breakdown
    const eventTypeResult = await pool.query(`
      SELECT event_type, COUNT(*) as count
      FROM purchase_embeddings
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const byEventType: Record<string, number> = {};
    eventTypeResult.rows.forEach(row => {
      byEventType[row.event_type] = parseInt(row.count);
    });

    return NextResponse.json({
      totalRecords: parseInt(stats.total_records) || 0,
      byEventType,
      uniqueDates: parseInt(stats.unique_dates) || 0,
      uniqueEmails: parseInt(stats.unique_emails) || 0,
      status: parseInt(stats.total_records) > 0 ? 'loaded' : 'empty'
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Stats error:', error);
    return NextResponse.json({ 
      totalRecords: 0, 
      status: 'error',
      error: error.message 
    });
  }
}
