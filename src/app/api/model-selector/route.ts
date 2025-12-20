import { NextResponse } from 'next/server';
import { selectBestModel } from '@/lib/mcp-client';

/**
 * API Route: Model Selector
 * Uses MCP server to select the best AI model for a query
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, preferences } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`[Model Selector] Selecting model for query: "${query.substring(0, 50)}..."`);

    // Call MCP server to select best model
    const selection = await selectBestModel(query, preferences);

    if (!selection) {
      // Fallback to default model
      console.log('[Model Selector] MCP selection failed, using fallback');
      return NextResponse.json({
        success: true,
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        displayName: 'GPT-3.5 Turbo',
        reasoning: 'MCP server unavailable, using default model',
        confidence: 0.5,
        isFallback: true
      });
    }

    console.log(`[Model Selector] Selected: ${selection.displayName} (${selection.confidence.toFixed(2)} confidence)`);
    console.log(`[Model Selector] Reasoning: ${selection.reasoning}`);

    return NextResponse.json({
      success: true,
      ...selection,
      isFallback: false
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Model Selector] Error:', err);
    
    // Return fallback on error
    return NextResponse.json({
      success: true,
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      displayName: 'GPT-3.5 Turbo',
      reasoning: `Error in model selection: ${err.message}. Using default model.`,
      confidence: 0.5,
      isFallback: true,
      error: err.message
    });
  }
}

/**
 * GET endpoint to check MCP server status
 */
export async function GET() {
  try {
    // Try to import and check connection
    const { getMCPClient } = await import('@/lib/mcp-client');
    const client = await getMCPClient();
    
    // Try to read capabilities resource
    const capabilities = await client.readResource('model://capabilities');
    
    return NextResponse.json({
      status: 'connected',
      availableModels: capabilities.metadata?.availableModels || 0,
      totalModels: capabilities.metadata?.totalModels || 0
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({
      status: 'disconnected',
      error: err.message
    }, { status: 503 });
  }
}
