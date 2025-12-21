export interface User {
    id: number;
    email: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface UserWithPassword extends User {
    password_hash: string;
}

export interface Session {
    id: number;
    user_id: number;
    token: string;
    expires_at: Date;
    created_at: Date;
}

export interface RegisterRequest {
    email: string;
    name: string;
    password: string;
    confirmPassword?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
    error?: string;
}

export interface SessionResponse {
    authenticated: boolean;
    user?: User;
    error?: string;
}
