'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Cpu, Check, Loader2 } from 'lucide-react';

export type AIProvider = 'openai' | 'ollama' | 'anthropic' | 'google';

interface ProviderInfo {
  id: string;
  name: string;
  available: boolean;
  model: string;
}

interface ModelSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

export function ModelSelector({ selectedProvider, onProviderChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available providers
  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch('/api/chat');
        const data = await response.json();
        setProviders(data.providers || []);
      } catch (error) {
        console.error('Failed to fetch providers:', error);
        // Default providers if API fails
        setProviders([
          { id: 'openai', name: 'OpenAI GPT', available: true, model: 'gpt-3.5-turbo' },
          { id: 'ollama', name: 'Ollama', available: true, model: 'llama3' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProvider = providers.find(p => p.id === selectedProvider);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        title={currentProvider?.name || 'Select Model'}
        className="flex items-center justify-center gap-1 w-12 h-9 rounded-lg cursor-pointer
                   text-[var(--muted)] hover:text-[var(--btn-primary-bg)] 
                   hover:bg-[var(--btn-primary-bg)]/10
                   transition-all duration-200"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Cpu className="w-5 h-5" />
            <ChevronUp className="w-3 h-3 opacity-50" />
          </>
        )}
      </button>

      {/* Dropdown - opens upward */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl overflow-hidden
                        bg-[var(--surface-elevated)] border border-[var(--glass-border)]
                        shadow-lg z-[100] animate-fade-in-up">
          <div className="p-2">
            <div className="text-xs text-[var(--muted)] px-2 py-1 mb-1">
              AI Provider
            </div>
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => {
                  if (provider.available) {
                    onProviderChange(provider.id as AIProvider);
                    setIsOpen(false);
                  }
                }}
                disabled={!provider.available}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                           transition-all duration-150
                           ${provider.available 
                             ? 'hover:bg-[var(--glass-bg)] cursor-pointer' 
                             : 'opacity-50 cursor-not-allowed'
                           }
                           ${selectedProvider === provider.id 
                             ? 'bg-[var(--btn-primary-bg)]/10 text-[var(--btn-primary-bg)]' 
                             : 'text-[var(--foreground)]'
                           }`}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{provider.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {provider.available ? provider.model : 'Not configured'}
                  </div>
                </div>
                {selectedProvider === provider.id && (
                  <Check className="w-4 h-4 text-[var(--btn-primary-bg)]" />
                )}
              </button>
            ))}
          </div>
          
          {/* Info footer */}
          <div className="px-3 py-2 bg-[var(--glass-bg)] border-t border-[var(--glass-border)]">
            <p className="text-[10px] text-[var(--muted)]">
              Model selection affects general chat. Data queries always use configured provider.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
