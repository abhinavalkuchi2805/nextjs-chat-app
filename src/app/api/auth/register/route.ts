import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { hashPassword, isValidEmail, isValidPassword, generateToken, createAuthCookie } from '@/lib/auth';
import { RegisterRequest, AuthResponse } from '@/types/auth-types';

export async function POST(request: NextRequest) {
    try {
        const body: RegisterRequest = await request.json();
        const { email, name, password, confirmPassword } = body;

        // Validate input
        if (!email || !name || !password) {
            return NextResponse.json(
                { success: false, error: 'Email, name, and password are required' } as AuthResponse,
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

        // Validate password strength
        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { success: false, error: passwordValidation.message } as AuthResponse,
                { status: 400 }
            );
        }

        // Check if passwords match (if confirmPassword is provided)
        if (confirmPassword && password !== confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'Passwords do not match' } as AuthResponse,
                { status: 400 }
            );
        }

        const pool = getPool();

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' } as AuthResponse,
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, name, created_at, updated_at`,
            [email.toLowerCase(), passwordHash, name]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = generateToken(user);

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
                message: 'Registration successful',
            } as AuthResponse,
            { status: 201 }
        );

        // Set auth cookie
        response.headers.set('Set-Cookie', createAuthCookie(token));

        return response;
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred during registration' } as AuthResponse,
            { status: 500 }
        );
    }
}
