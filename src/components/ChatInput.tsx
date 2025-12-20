'use client';

import { useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { SuggestedQueries } from './SuggestedQueries';
import { ModelSelector, AIProvider } from './ModelSelector';

interface ChatInputProps {
  inputText: string;
  loading: boolean;
  showSuggestions: boolean;
  selectedProvider: AIProvider;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileSelect?: (file: File | null) => void;
  onSuggestionSelect: (query: string) => void;
  onProviderChange?: (provider: AIProvider) => void;
}

export function ChatInput({
  inputText,
  loading,
  showSuggestions,
  selectedProvider,
  onInputChange,
  onSend,
  onFileSelect,
  onSuggestionSelect,
  onProviderChange,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 sticky bottom-0 z-20">
      <div className="max-w-6xl mx-auto">
        {/* Input container with integrated elements */}
        <div className="bg-[var(--surface-elevated)] border border-[var(--glass-border)] rounded-2xl
                        focus-within:ring-2 focus-within:ring-[var(--focus-ring)] focus-within:border-[var(--btn-primary-bg)]/50
                        transition-all duration-200 shadow-lg relative">
          
          {/* Suggested Queries */}
          <SuggestedQueries onSelect={onSuggestionSelect} visible={showSuggestions} />
          
          {/* Input row */}
          <div className="flex items-end gap-2 p-2">
            {/* Model Selector */}
            {onProviderChange && (
              <ModelSelector 
                selectedProvider={selectedProvider}
                onProviderChange={onProviderChange}
              />
            )}
            
            {/* Upload button */}
            {onFileSelect && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center justify-center w-9 h-9 rounded-lg
                             text-[var(--muted)] hover:text-[var(--btn-primary-bg)] 
                             hover:bg-[var(--btn-primary-bg)]/10
                             transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                  title="Upload CSV"
                >
                  <Paperclip className="w-4 h-4 cursor-pointer" />
                </button>
              </>
            )}
            
            {/* Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about purchases, page views, or searches..."
              className="flex-1 bg-transparent text-[var(--foreground)] text-sm resize-none 
                         placeholder:text-[var(--muted)] focus:outline-none
                         min-h-[60px] max-h-[200px] py-3"
              rows={2}
            />
            
            {/* Send button */}
            <button
              onClick={onSend}
              disabled={!inputText.trim() || loading}
              className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 flex-shrink-0 cursor-pointer ${
                inputText.trim() && !loading
                  ? 'text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] active:scale-95'
                  : 'text-[var(--muted)] cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Keyboard hint */}
        <div className="text-center mt-2">
          <span className="text-[10px] text-[var(--muted)]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--glass-bg)] text-[var(--muted-foreground)] font-mono">Enter</kbd> to send
          </span>
        </div>
      </div>
    </div>
  );
}
