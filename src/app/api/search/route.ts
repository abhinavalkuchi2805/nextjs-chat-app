import { NextRequest, NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { processQuery, generateResponse } from '@/lib/search';
import { generateLLMResponse } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initDB();

    const body = await request.json();
    const { query, topK = 10, useLLM = true, llmProvider = 'openai' } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    console.log(`Processing search query: "${query}" with topK=${topK}`);

    // Process the query
    const searchResult = await processQuery(query, topK);
    
    // Choose response generation method
    let response: string;
    if (useLLM) {
      response = await generateLLMResponse(query, searchResult, llmProvider);
    } else {
      response = generateResponse(query, searchResult);
    }

    return NextResponse.json({
      success: true,
      query,
      matches: searchResult.results.matches,
      response,
      method: searchResult.method,
      totalFound: searchResult.results.matches.length,
      usedLLM: useLLM,
      llmProvider: useLLM ? llmProvider : null
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
