'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
    lastMessage: string;
    onSelect: (question: string) => void;
    visible: boolean;
}

export function SuggestedQuestions({ lastMessage, onSelect, visible }: SuggestedQuestionsProps) {
    const [questions, setQuestions] = useState<string[]>([]);
    const [showArrows, setShowArrows] = useState(false);
    const lastProcessedMessage = useRef<string>('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If not visible, clear questions
        if (!visible) {
            setQuestions([]);
            lastProcessedMessage.current = '';
            setShowArrows(false);
            return;
        }

        // Only process if message changed
        if (!lastMessage || lastMessage === lastProcessedMessage.current) {
            return;
        }

        // Extract suggested questions from the AI response
        const extracted = extractSuggestedQuestions(lastMessage);
        setQuestions(extracted);
        lastProcessedMessage.current = lastMessage;
    }, [lastMessage, visible]);

    useEffect(() => {
        const checkOverflow = () => {
            if (scrollContainerRef.current) {
                const { scrollWidth, clientWidth } = scrollContainerRef.current;
                setShowArrows(scrollWidth > clientWidth);
            }
        };

        // Little delay to ensure DOM is updated
        setTimeout(checkOverflow, 0);

        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [questions, visible]);

    const extractSuggestedQuestions = (text: string): string[] => {
        // Console log for debugging
        console.log('[SuggestedQuestions] Parsing text for suggestions:', text.substring(0, 50) + '...');

        const questions: string[] = [];

        // Flexible pattern to match various formats:
        // **Suggested Questions**, ### Suggested Questions, Suggested Queries, etc.
        const pattern = /(?:(?:\*\*|#{1,3}|##)?\s*(?:Suggested|Follow-up|Related|Sample)\s*(?:Questions|Queries|Prompts|Topics)(?:\*\*|#{1,3}|##)?):?\s*(?:[\r\n]+)((?:(?:[-*]|\d+\.)\s+.+(?:[\r\n]+|$))+)/i;

        const match = text.match(pattern);
        if (match && match[1]) {
            console.log('[SuggestedQuestions] Match found:', match[0]);
            const lines = match[1].trim().split(/\r?\n/);
            for (const line of lines) {
                // Match content after list marker (number or bullet)
                const questionMatch = line.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
                if (questionMatch && questionMatch[1]) {
                    questions.push(questionMatch[1].trim());
                }
            }
        } else {
            console.log('[SuggestedQuestions] No match found');
        }

        return questions;
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!visible || questions.length === 0) {
        return null;
    }

    return (
        <div className="px-4 pb-2 pt-2 border-b border-[var(--glass-border)] animate-fade-in-up bg-[var(--surface-elevated)]/30 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gradient-start)] ml-1" />
                <span className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">
                    Try:
                </span>

                {showArrows && (
                    <button
                        onClick={() => scroll('left')}
                        className="p-1 rounded-lg hover:bg-[var(--glass-border)] text-[var(--muted-foreground)] 
                                   hover:text-[var(--foreground)] transition-colors flex-shrink-0"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}

                <div
                    ref={scrollContainerRef}
                    className="flex gap-2 overflow-x-auto pb-1 scroll-smooth scrollbar-hide flex-1"
                >
                    {questions.map((question, index) => (
                        <button
                            key={index}
                            onClick={() => onSelect(question)}
                            className="whitespace-nowrap px-3 py-1 text-xs rounded-full glass 
                                       hover:bg-[var(--glass-border)] text-[var(--foreground)] 
                                       transition-all duration-200 hover:scale-[1.02] active:scale-95 
                                       cursor-pointer border border-[var(--glass-border)] text-left flex-shrink-0 bg-opacity-20"
                        >
                            {question}
                        </button>
                    ))}
                </div>

                {showArrows && (
                    <button
                        onClick={() => scroll('right')}
                        className="p-1 rounded-lg hover:bg-[var(--glass-border)] text-[var(--muted-foreground)] 
                                   hover:text-[var(--foreground)] transition-colors flex-shrink-0"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
