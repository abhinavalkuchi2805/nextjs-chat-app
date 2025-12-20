import { streamText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { classifyQuery } from '@/lib/query-classifier';
import { AIProvider } from '@/lib/ai-providers';

// Define tools
const tools = {
  search_vector_database: tool({
    description: 'Search uploaded data using vector similarity',
    parameters: z.object({
      query: z.string().describe('The search query'),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ query, limit }) => {
      console.log(`[Tool] Executing vector search: ${query}`);
      const { executeFunction } = await import('@/lib/functions/function-executor');
      const result = await executeFunction({
        name: 'search_vector_database',
        parameters: { query, limit }
      });
      return result.success ? JSON.stringify(result.data) : "No results found";
    },
  }) as any,
  get_statistics: tool({
    description: 'Get statistics and metrics',
    parameters: z.object({
      metric: z.string(),
      timeRange: z.string().optional().default('week'),
    }),
    execute: async ({ metric, timeRange }) => {
      const { executeFunction } = await import('@/lib/functions/function-executor');
      const result = await executeFunction({
        name: 'get_statistics',
        parameters: { metric, timeRange }
      });
      return result.success ? JSON.stringify(result.data) : "No stats found";
    },
  }) as any
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
    const {
      query,
      provider = 'openai',
      messages = [],
      temperature = 0.7,
    } = body;

    // Build core messages
    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    if (query) {
      coreMessages.push({ role: 'user', content: query });
    }

    if (coreMessages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Provider selection
    let model;

    if (provider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
      model = google(process.env.GOOGLE_MODEL || 'gemini-1.5-pro');
    } else {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      model = openai(process.env.OPENAI_MODEL || 'gpt-3.5-turbo');
    }

    // Call streamText
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      tools,
      maxSteps: 5,
      temperature,
    } as any);

    return (result as any).toDataStreamResponse();

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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
