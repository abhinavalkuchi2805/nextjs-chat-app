/**
 * Model Capability Matrix
 * Defines capabilities, strengths, and characteristics of each AI model
 */

export interface ModelCapability {
  model: string;
  provider: 'openai' | 'google' | 'anthropic' | 'ollama';
  displayName: string;
  
  // Technical specs
  contextWindow: number;
  maxOutputTokens: number;
  
  // Performance characteristics (0-1 scale)
  speed: number;           // Response speed
  reasoning: number;       // Complex reasoning ability
  coding: number;          // Code generation quality
  creative: number;        // Creative writing ability
  analytics: number;       // Data analysis capability
  
  // Cost (USD per 1M tokens)
  costPer1MInput: number;
  costPer1MOutput: number;
  
  // Availability
  available: boolean;
}

export const MODEL_CAPABILITIES: ModelCapability[] = [
  // OpenAI Models
  {
    model: 'gpt-4',
    provider: 'openai',
    displayName: 'GPT-4',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    speed: 0.6,
    reasoning: 0.95,
    coding: 0.95,
    creative: 0.90,
    analytics: 0.90,
    costPer1MInput: 30.0,
    costPer1MOutput: 60.0,
    available: true
  },
  {
    model: 'gpt-4-turbo',
    provider: 'openai',
    displayName: 'GPT-4 Turbo',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    speed: 0.75,
    reasoning: 0.95,
    coding: 0.95,
    creative: 0.90,
    analytics: 0.90,
    costPer1MInput: 10.0,
    costPer1MOutput: 30.0,
    available: true
  },
  {
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    displayName: 'GPT-3.5 Turbo',
    contextWindow: 16385,
    maxOutputTokens: 4096,
    speed: 0.95,
    reasoning: 0.75,
    coding: 0.80,
    creative: 0.75,
    analytics: 0.70,
    costPer1MInput: 0.5,
    costPer1MOutput: 1.5,
    available: true
  },
  {
    model: 'gpt-4.1-mini',
    provider: 'openai',
    displayName: 'GPT-4.1 Mini',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    speed: 0.90,
    reasoning: 0.85,
    coding: 0.88,
    creative: 0.82,
    analytics: 0.80,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
    available: true
  },

  // Google Gemini Models
  {
    model: 'gemini-2.0-flash-exp',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    speed: 0.98,
    reasoning: 0.90,
    coding: 0.92,
    creative: 0.88,
    analytics: 0.85,
    costPer1MInput: 0.0,  // Currently free in experimental
    costPer1MOutput: 0.0,
    available: true
  },
  {
    model: 'gemini-1.5-pro',
    provider: 'google',
    displayName: 'Gemini 1.5 Pro',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    speed: 0.70,
    reasoning: 0.93,
    coding: 0.90,
    creative: 0.85,
    analytics: 0.88,
    costPer1MInput: 1.25,
    costPer1MOutput: 5.0,
    available: true
  },
  {
    model: 'gemini-1.5-flash',
    provider: 'google',
    displayName: 'Gemini 1.5 Flash',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    speed: 0.95,
    reasoning: 0.85,
    coding: 0.85,
    creative: 0.80,
    analytics: 0.82,
    costPer1MInput: 0.075,
    costPer1MOutput: 0.30,
    available: true
  },

  // Anthropic Claude Models
  {
    model: 'claude-3-opus',
    provider: 'anthropic',
    displayName: 'Claude 3 Opus',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    speed: 0.65,
    reasoning: 0.98,
    coding: 0.93,
    creative: 0.95,
    analytics: 0.92,
    costPer1MInput: 15.0,
    costPer1MOutput: 75.0,
    available: false
  },
  {
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    displayName: 'Claude 3 Sonnet',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    speed: 0.80,
    reasoning: 0.90,
    coding: 0.88,
    creative: 0.90,
    analytics: 0.87,
    costPer1MInput: 3.0,
    costPer1MOutput: 15.0,
    available: false
  },

  // Ollama Local Models
  {
    model: 'llama3',
    provider: 'ollama',
    displayName: 'Llama 3 (Local)',
    contextWindow: 8192,
    maxOutputTokens: 2048,
    speed: 0.70,
    reasoning: 0.75,
    coding: 0.75,
    creative: 0.70,
    analytics: 0.65,
    costPer1MInput: 0.0,  // Free (local)
    costPer1MOutput: 0.0,
    available: true
  },
  {
    model: 'mistral:7b',
    provider: 'ollama',
    displayName: 'Mistral 7B (Local)',
    contextWindow: 8192,
    maxOutputTokens: 2048,
    speed: 0.85,
    reasoning: 0.70,
    coding: 0.72,
    creative: 0.68,
    analytics: 0.65,
    costPer1MInput: 0.0,  // Free (local)
    costPer1MOutput: 0.0,
    available: true
  }
];

/**
 * Get capability information for a specific model
 */
export function getModelCapability(model: string): ModelCapability | undefined {
  return MODEL_CAPABILITIES.find(m => m.model === model);
}

/**
 * Get all available models
 */
export function getAvailableModels(): ModelCapability[] {
  return MODEL_CAPABILITIES.filter(m => m.available);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: string): ModelCapability[] {
  return MODEL_CAPABILITIES.filter(m => m.provider === provider && m.available);
}
