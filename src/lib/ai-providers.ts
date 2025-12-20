import { ChatMessage } from '@/types';

export type AIProvider = 'openai' | 'ollama' | 'anthropic' | 'google';

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  available: boolean;
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
}

// Available AI providers
export const AI_PROVIDERS: AIProviderConfig[] = [
  { id: 'openai', name: 'OpenAI GPT', description: 'GPT-4 / GPT-3.5', available: true },
  { id: 'ollama', name: 'Ollama', description: 'Local LLM (Llama, Mistral)', available: true },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3', available: false },
  { id: 'google', name: 'Google AI', description: 'Gemini Pro', available: true },
];

// Generate chat response using OpenAI
async function generateOpenAIResponse(request: ChatRequest): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Generate chat response using Ollama
async function generateOllamaResponse(request: ChatRequest): Promise<string> {
  const OLLAMA_URL = process.env.OLLAMA_URL?.replace('/api/embeddings', '/api/chat')
    || 'http://localhost:11434/api/chat';
  const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3';

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens ?? 1000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message?.content || data.response;
}

// Generate chat response using Anthropic (Claude)
async function generateAnthropicResponse(request: ChatRequest): Promise<string> {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';

  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  // Extract system message
  const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = request.messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: request.maxTokens ?? 1000,
      system: systemMessage,
      messages: chatMessages
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Generate chat response using Google AI (Gemini) via Vercel AI SDK
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

async function generateGoogleResponse(request: ChatRequest): Promise<string> {
  const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;
  const GOOGLE_MODEL = process.env.GOOGLE_MODEL || 'gemini-1.5-pro';

  if (!GOOGLE_API_KEY) {
    throw new Error('Google AI API key not configured');
  }

  const google = createGoogleGenerativeAI({
    apiKey: GOOGLE_API_KEY,
  });

  const { text } = await generateText({
    model: google(GOOGLE_MODEL),
    messages: request.messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content
    })),
    temperature: request.temperature ?? 0.7,
    // maxTokens: request.maxTokens ?? 1000,
  });

  return text;
}

// Main function to generate chat response from any provider
export async function generateChatResponse(request: ChatRequest): Promise<string> {
  const provider = request.provider || 'openai';

  console.log(`Generating chat response using ${provider}...`);

  switch (provider) {
    case 'openai':
      return generateOpenAIResponse(request);
    case 'ollama':
      return generateOllamaResponse(request);
    case 'anthropic':
      return generateAnthropicResponse(request);
    case 'google':
      return generateGoogleResponse(request);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// Convert chat history to API message format
export function convertChatHistory(
  messages: ChatMessage[],
  systemPrompt?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // Add system prompt
  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt });
  }

  // Convert chat messages
  for (const msg of messages) {
    if (msg.id === 'welcome') continue; // Skip welcome message
    if (msg.text === 'Thinking...') continue; // Skip thinking indicator

    apiMessages.push({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    });
  }

  return apiMessages;
}
