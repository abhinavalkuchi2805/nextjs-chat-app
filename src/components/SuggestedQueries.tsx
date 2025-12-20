'use client';

import { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  visible: boolean;
}

export function SuggestedQueries({ onSelect, visible }: SuggestedQueriesProps) {
  const [startIndex, setStartIndex] = useState(0);
  const suggestions = [
    "Show me all purchases from last week",
    "What did users search for?",
    "Show page views for skincare products",
    "Top 5 most expensive purchases",
    "Show top search terms",
    "Recent user activity",
  ];
  
  const visibleCount = 2;
  const maxIndex = suggestions.length - visibleCount;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const visibleSuggestions = suggestions.slice(startIndex, startIndex + visibleCount);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border)]">
      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{color: 'var(--gradient-mid)'}} />
      <span className="text-xs text-[var(--muted)] whitespace-nowrap">Try:</span>
      
      <button
        onClick={handlePrev}
        disabled={startIndex === 0}
        className={`p-1 rounded-md transition-colors flex-shrink-0 ${
          startIndex === 0 
            ? 'text-[var(--muted)]/30 cursor-not-allowed' 
            : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)] cursor-pointer'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex-1 flex gap-2 overflow-hidden">
        {visibleSuggestions.map((query, idx) => (
          <button
            key={startIndex + idx}
            onClick={() => onSelect(query)}
            className="flex-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]
                       truncate text-center transition-all duration-200 px-3 py-1.5 rounded-lg cursor-pointer
                       border border-[var(--glass-border)] bg-transparent
                       hover:border-[var(--btn-primary-bg)]/50 hover:bg-[var(--btn-primary-bg)]/10"
          >
            {query}
          </button>
        ))}
      </div>
      
      <button
        onClick={handleNext}
        disabled={startIndex >= maxIndex}
        className={`p-1 rounded-md transition-colors flex-shrink-0 ${
          startIndex >= maxIndex 
            ? 'text-[var(--muted)]/30 cursor-not-allowed' 
            : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)] cursor-pointer'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
