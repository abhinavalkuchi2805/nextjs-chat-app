'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import { UserPlus, LogIn } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (data: Record<string, string>) => {
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    name: data.name,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setError(result.error || 'Registration failed. Please try again.');
                setLoading(false);
                return;
            }

            // Redirect to home page
            router.push('/');
            router.refresh();
        } catch (err) {
            console.error('Registration error:', err);
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background gradient effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--gradient-start)] opacity-20 blur-[100px] rounded-full animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--gradient-end)] opacity-20 blur-[100px] rounded-full animate-float" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
                        <UserPlus className="w-8 h-8 gradient-text" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">
                        Create Account
                    </h1>
                    <p className="text-muted-foreground">
                        Join us and start chatting with AI
                    </p>
                </div>

                {/* Register Form */}
                <div className="glass-strong rounded-2xl p-8 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <AuthForm
                        mode="register"
                        onSubmit={handleRegister}
                        error={error}
                        loading={loading}
                    />

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-[var(--gradient-start)] hover:text-[var(--gradient-mid)] 
                  font-medium transition-colors inline-flex items-center gap-1"
                            >
                                Sign in
                                <LogIn className="w-4 h-4" />
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
