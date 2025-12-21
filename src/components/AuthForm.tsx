'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password';
    icon: React.ReactNode;
    placeholder: string;
    required?: boolean;
}

interface AuthFormProps {
    mode: 'login' | 'register';
    onSubmit: (data: Record<string, string>) => Promise<void>;
    error?: string;
    loading?: boolean;
}

export default function AuthForm({ mode, onSubmit, error, loading = false }: AuthFormProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const loginFields: FormField[] = [
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            icon: <Mail className="w-5 h-5" />,
            placeholder: 'Enter your email',
            required: true,
        },
        {
            name: 'password',
            label: 'Password',
            type: 'password',
            icon: <Lock className="w-5 h-5" />,
            placeholder: 'Enter your password',
            required: true,
        },
    ];

    const registerFields: FormField[] = [
        {
            name: 'name',
            label: 'Full Name',
            type: 'text',
            icon: <User className="w-5 h-5" />,
            placeholder: 'Enter your full name',
            required: true,
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            icon: <Mail className="w-5 h-5" />,
            placeholder: 'Enter your email',
            required: true,
        },
        {
            name: 'password',
            label: 'Password',
            type: 'password',
            icon: <Lock className="w-5 h-5" />,
            placeholder: 'Create a password',
            required: true,
        },
        {
            name: 'confirmPassword',
            label: 'Confirm Password',
            type: 'password',
            icon: <Lock className="w-5 h-5" />,
            placeholder: 'Confirm your password',
            required: true,
        },
    ];

    const fields = mode === 'login' ? loginFields : registerFields;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        fields.forEach((field) => {
            if (field.required && !formData[field.name]?.trim()) {
                errors[field.name] = `${field.label} is required`;
            }
        });

        if (mode === 'register' && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        await onSubmit(formData);
    };

    const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
        if (field === 'password') {
            setShowPassword(!showPassword);
        } else {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                    <label htmlFor={field.name} className="block text-sm font-medium text-foreground">
                        {field.label}
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {field.icon}
                        </div>
                        <input
                            id={field.name}
                            name={field.name}
                            type={
                                field.type === 'password'
                                    ? field.name === 'password'
                                        ? showPassword
                                            ? 'text'
                                            : 'password'
                                        : showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    : field.type
                            }
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            disabled={loading}
                            className={`w-full pl-11 pr-${field.type === 'password' ? '11' : '4'} py-3 
                glass rounded-xl text-foreground placeholder-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-[var(--gradient-start)] 
                transition-all duration-200
                ${validationErrors[field.name] ? 'ring-2 ring-red-500' : ''}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {field.type === 'password' && (
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility(field.name as 'password' | 'confirmPassword')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                  hover:text-foreground transition-colors"
                                disabled={loading}
                            >
                                {(field.name === 'password' ? showPassword : showConfirmPassword) ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        )}
                    </div>
                    {validationErrors[field.name] && (
                        <p className="text-sm text-red-500 animate-fade-in-up">{validationErrors[field.name]}</p>
                    )}
                </div>
            ))}

            {error && (
                <div className="glass-strong rounded-xl p-4 border border-red-500/30 bg-red-500/10 animate-fade-in-up">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl font-medium text-white
          bg-gradient-to-r from-[var(--user-bubble-from)] via-[var(--user-bubble-via)] to-[var(--user-bubble-to)]
          hover:shadow-lg hover:shadow-[var(--glow-primary)]
          focus:outline-none focus:ring-2 focus:ring-[var(--gradient-start)] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-300 transform hover:scale-[1.02]
          flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                    </>
                ) : (
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
            </button>
        </form>
    );
}
