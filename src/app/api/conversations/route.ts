import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken, getTokenFromCookie } from '@/lib/auth';

// GET - List all conversations for authenticated user
export async function GET(request: NextRequest) {
    try {
        // Get and verify token
        const cookieHeader = request.headers.get('cookie');
        const token = getTokenFromCookie(cookieHeader);

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const pool = getPool();

        // Get all conversations for the user with message count
        const result = await pool.query(
            `SELECT 
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.updated_at DESC`,
            [decoded.userId]
        );

        return NextResponse.json(
            {
                success: true,
                conversations: result.rows,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}

// POST - Create new conversation
export async function POST(request: NextRequest) {
    try {
        // Get and verify token
        const cookieHeader = request.headers.get('cookie');
        const token = getTokenFromCookie(cookieHeader);

        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title } = body;

        const pool = getPool();

        // Create new conversation
        const result = await pool.query(
            `INSERT INTO conversations (user_id, title, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, user_id, title, created_at, updated_at`,
            [decoded.userId, title || 'New Conversation']
        );

        return NextResponse.json(
            {
                success: true,
                conversation: result.rows[0],
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 500 }
        );
    }
}
