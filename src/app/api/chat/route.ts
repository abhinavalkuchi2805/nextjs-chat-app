import { streamText, tool, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { classifyQuery } from '@/lib/query-classifier';
import { AIProvider } from '@/lib/ai-providers';

// Define tools with proper typing
const tools = {
  search_vector_database: tool({
    description: 'Search uploaded data using vector similarity',
    parameters: z.object({
      query: z.string().describe('The search query'),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ query, limit = 5 }): Promise<string> => {
      try {
        console.log(`[Tool] Executing vector search: ${query}`);
        const { executeFunction } = await import('@/lib/functions/function-executor');
        const result = await executeFunction({
          name: 'search_vector_database',
          parameters: { query, limit }
        });
        return result.success ? JSON.stringify(result.data) : JSON.stringify({ error: "No results found" });
      } catch (error) {
        console.error('[Tool] Vector search error:', error);
        return JSON.stringify({ error: "Search failed" });
      }
    },
  } as any),
  get_statistics: tool({
    description: 'Get statistics and metrics',
    parameters: z.object({
      metric: z.string().describe('The metric to retrieve'),
      timeRange: z.string().optional().default('week').describe('Time range for the metric'),
    }),
    execute: async ({ metric, timeRange = 'week' }): Promise<string> => {
      try {
        const { executeFunction } = await import('@/lib/functions/function-executor');
        const result = await executeFunction({
          name: 'get_statistics',
          parameters: { metric, timeRange }
        });
        return result.success ? JSON.stringify(result.data) : JSON.stringify({ error: "No stats found" });
      } catch (error) {
        console.error('[Tool] Statistics error:', error);
        return JSON.stringify({ error: "Stats retrieval failed" });
      }
    },
  } as any)
};

const SYSTEM_PROMPT = `You are a helpful AI assistant. You can:
- Answer general questions about any topic
- Help with explanations, summaries, and analysis
- Provide recommendations and suggestions
- Assist with writing and creative tasks

Be conversational, helpful, and concise in your responses.
If the user asks about specific data they've uploaded, let them know they should ask a data-related question like "show me purchases" or "what did users search for".

At the end of your response, always, provide 3 relevant follow-up questions that the user could ask next. These should be short and actionable. Format them as a numbered list under the heading "**Suggested Questions**".`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API] Received request');
    console.log('[API] Body keys:', Object.keys(body));
    console.log('[API] Full body:', JSON.stringify(body, null, 2));

    // Extract provider from body (custom field we send)
    const provider = body.provider || 'openai';
    const temperature = body.temperature || 0.7;

    console.log('[API] Provider:', provider);

    // The Vercel AI SDK sends messages in the 'messages' field
    // Each message has: { id, role, content, createdAt }
    const incomingMessages = body.messages || [];

    console.log('[API] Incoming messages count:', incomingMessages.length);
    console.log('[API] Incoming messages:', JSON.stringify(incomingMessages, null, 2));

    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      console.error('[API] No messages provided or not an array');
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Convert to the format expected by streamText
    // streamText expects messages with { role, content }
    const coreMessages = incomingMessages.map((m: any) => {
      let content = '';

      // Extract content from various formats
      if (m.content) {
        content = m.content;
      } else if (m.text) {
        content = m.text;
      } else if (m.parts && Array.isArray(m.parts)) {
        // Handle parts array format from newer AI SDK
        content = m.parts
          .filter((p: any) => p.type === 'text' && p.text)
          .map((p: any) => p.text)
          .join('');
      }

      return {
        role: m.role,
        content: content
      };
    });

    console.log('[API] Core messages:', JSON.stringify(coreMessages, null, 2));

    // Provider selection
    let model;

    if (provider === 'google') {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        console.error('[API] Google API key not found');
        return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
      }
      console.log('[API] Using Google Gemini');
      const google = createGoogleGenerativeAI({ apiKey });
      model = google(process.env.GOOGLE_MODEL || 'gemini-1.5-pro');
    } else {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('[API] OpenAI API key not found');
        return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
      }
      console.log('[API] Using OpenAI');
      const openai = createOpenAI({ apiKey });
      model = openai(process.env.OPENAI_MODEL || 'gpt-3.5-turbo');
    }

    console.log('[API] Calling streamText...');

    // Call streamText with the messages
    // Tools disabled due to persistent schema validation error with Zod
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      // tools, // DISABLED: Schema validation error persists even with Zod 3.x
      maxSteps: 5,
      temperature,
    } as any);

    console.log('[API] Returning stream response');

    // Return the streaming response
    // toUIMessageStreamResponse is the correct method for useChat hook
    return result.toUIMessageStreamResponse();

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[API] Chat API Error:', err);
    console.error('[API] Error stack:', err.stack);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}

// GET endpoint to check available providers
export async function GET() {
  const providers = [
    {
      id: 'openai',
      name: 'OpenAI GPT',
      available: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    },
    {
      id: 'google',
      name: 'Google Gemini',
      available: !!process.env.GOOGLE_AI_API_KEY,
      model: process.env.GOOGLE_MODEL || 'gemini-pro'
    }
  ];

  return NextResponse.json({
    providers,
    defaultProvider: 'openai'
  });
}
