import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyPassword, generateToken, createAuthCookie, isValidEmail } from '@/lib/auth';
import { LoginRequest, AuthResponse } from '@/types/auth-types';

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' } as AuthResponse,
                { status: 400 }
            );
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' } as AuthResponse,
                { status: 400 }
            );
        }

        const pool = getPool();

        // Find user by email
        const result = await pool.query(
            'SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' } as AuthResponse,
                { status: 401 }
            );
        }

        const user = result.rows[0];

        // Verify password
        const isPasswordValid = await verifyPassword(password, user.password_hash);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' } as AuthResponse,
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at,
            updated_at: user.updated_at,
        });

        // Create response with cookie
        const response = NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                },
                token,
                message: 'Login successful',
            } as AuthResponse,
            { status: 200 }
        );

        // Set auth cookie
        response.headers.set('Set-Cookie', createAuthCookie(token));

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred during login' } as AuthResponse,
            { status: 500 }
        );
    }
}
