import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken, getTokenFromCookie } from '@/lib/auth';

// POST - Add messages to conversation
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const conversationId = params.id;

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
        const { messages } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            );
        }

        const pool = getPool();

        // Verify user owns this conversation
        const convResult = await pool.query(
            `SELECT user_id FROM conversations WHERE id = $1`,
            [conversationId]
        );

        if (convResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Conversation not found' },
                { status: 404 }
            );
        }

        if (convResult.rows[0].user_id !== decoded.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Insert messages
        const insertedMessages = [];
        for (const msg of messages) {
            const { role, content } = msg;

            if (!role || !content || !['user', 'assistant'].includes(role)) {
                continue; // Skip invalid messages
            }

            const result = await pool.query(
                `INSERT INTO messages (conversation_id, role, content, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, conversation_id, role, content, created_at`,
                [conversationId, role, content]
            );

            insertedMessages.push(result.rows[0]);
        }

        // Update conversation's updated_at timestamp
        await pool.query(
            `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
            [conversationId]
        );

        // Auto-generate title from first user message if still "New Conversation"
        const titleResult = await pool.query(
            `SELECT title FROM conversations WHERE id = $1`,
            [conversationId]
        );

        if (titleResult.rows[0].title === 'New Conversation') {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                const title = firstUserMsg.content.length > 40
                    ? firstUserMsg.content.substring(0, 40) + '...'
                    : firstUserMsg.content;

                await pool.query(
                    `UPDATE conversations SET title = $1 WHERE id = $2`,
                    [title, conversationId]
                );
            }
        }

        return NextResponse.json(
            {
                success: true,
                messages: insertedMessages,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error adding messages:', error);
        return NextResponse.json(
            { error: 'Failed to add messages' },
            { status: 500 }
        );
    }
}
