import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken, getTokenFromCookie } from '@/lib/auth';

// GET - Get conversation with all messages
export async function GET(
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

        const pool = getPool();

        // Get conversation and verify ownership
        const convResult = await pool.query(
            `SELECT id, user_id, title, created_at, updated_at
       FROM conversations
       WHERE id = $1`,
            [conversationId]
        );

        if (convResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Conversation not found' },
                { status: 404 }
            );
        }

        const conversation = convResult.rows[0];

        // Verify user owns this conversation
        if (conversation.user_id !== decoded.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get all messages for this conversation
        const messagesResult = await pool.query(
            `SELECT id, role, content, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
            [conversationId]
        );

        return NextResponse.json(
            {
                success: true,
                conversation: {
                    ...conversation,
                    messages: messagesResult.rows,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversation' },
            { status: 500 }
        );
    }
}

// PUT - Update conversation (e.g., rename title)
export async function PUT(
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
        const { title } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const pool = getPool();

        // Verify ownership and update
        const result = await pool.query(
            `UPDATE conversations
       SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, title, created_at, updated_at`,
            [title, conversationId, decoded.userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Conversation not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                conversation: result.rows[0],
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating conversation:', error);
        return NextResponse.json(
            { error: 'Failed to update conversation' },
            { status: 500 }
        );
    }
}

// DELETE - Delete conversation
export async function DELETE(
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

        const pool = getPool();

        // Delete conversation (messages will be cascade deleted)
        const result = await pool.query(
            `DELETE FROM conversations
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
            [conversationId, decoded.userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Conversation not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Conversation deleted successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return NextResponse.json(
            { error: 'Failed to delete conversation' },
            { status: 500 }
        );
    }
}
