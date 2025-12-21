import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken, getTokenFromCookie } from '@/lib/auth';
import { SessionResponse } from '@/types/auth-types';

export async function GET(request: NextRequest) {
    try {
        // Get token from cookie
        const cookieHeader = request.headers.get('cookie');
        const token = getTokenFromCookie(cookieHeader);

        if (!token) {
            return NextResponse.json(
                { authenticated: false, error: 'No authentication token found' } as SessionResponse,
                { status: 401 }
            );
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json(
                { authenticated: false, error: 'Invalid or expired token' } as SessionResponse,
                { status: 401 }
            );
        }

        const pool = getPool();

        // Get user from database
        const result = await pool.query(
            'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { authenticated: false, error: 'User not found' } as SessionResponse,
                { status: 401 }
            );
        }

        const user = result.rows[0];

        return NextResponse.json(
            {
                authenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                },
            } as SessionResponse,
            { status: 200 }
        );
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { authenticated: false, error: 'An error occurred while checking session' } as SessionResponse,
            { status: 500 }
        );
    }
}
