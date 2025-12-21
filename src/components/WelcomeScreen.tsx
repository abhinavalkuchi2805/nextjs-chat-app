'use client';

import { Sparkles, MessageCircle, BarChart3, Search, TrendingUp } from 'lucide-react';

interface WelcomeScreenProps {
    onSelect: (query: string) => void;
    userName?: string;
}

export function WelcomeScreen({ onSelect, userName }: WelcomeScreenProps) {
    const firstName = userName ? userName.split(' ')[0] : '';
    const heading = firstName ? `How can I help you, ${firstName}?` : 'How can I help you today?';
    const suggestions = [
        {
            icon: <BarChart3 className="w-5 h-5" />,
            label: "Analyze Data",
            text: "Show me all purchases from last week"
        },
        {
            icon: <Search className="w-5 h-5" />,
            label: "Explore",
            text: "What did users search for?"
        },
        {
            icon: <TrendingUp className="w-5 h-5" />,
            label: "Trends",
            text: "Show top search terms vs purchases"
        },
        {
            icon: <Sparkles className="w-5 h-5" />,
            label: "Insights",
            text: "Identify top 5 most expensive purchases"
        },
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-full animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center mb-8 shadow-2xl shadow-[var(--gradient-start)]/20 animate-float">
                <Sparkles className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)]">
                {heading}
            </h1>
            <p className="text-[var(--muted)] text-center max-w-md mb-12 text-lg">
                Ask about your data, get insights, or explore trends using natural language.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full px-4">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(s.text)}
                        className="flex items-center gap-4 p-5 rounded-2xl glass hover:bg-[var(--glass-border)] 
                       border border-[var(--glass-border)] hover:border-[var(--gradient-start)]/50
                       transition-all duration-300 group text-left hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="p-3 rounded-xl bg-[var(--surface-elevated)] group-hover:bg-[var(--gradient-start)]/10 group-hover:text-[var(--gradient-start)] transition-colors text-[var(--muted-foreground)]">
                            {s.icon}
                        </div>
                        <div>
                            <span className="block text-xs font-semibold text-[var(--gradient-start)] mb-1 uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                                {s.label}
                            </span>
                            <span className="text-sm font-medium text-[var(--foreground)] line-clamp-2">
                                {s.text}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
