'use client';

import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 max-w-[80%] p-4 glass rounded-2xl rounded-bl-none animate-fade-in-up">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--btn-primary-bg)]">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex items-center gap-1.5 px-2">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
    </div>
  );
}
