/**
 * Functions API Route
 * Endpoint for executing AI agent functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeFunction, executeFunctions, logFunctionExecution } from '@/lib/functions/function-executor';
import { AVAILABLE_FUNCTIONS, getFunctionDefinition } from '@/lib/functions/function-definitions';

/**
 * GET /api/functions
 * List all available functions
 */
export async function GET() {
  try {
    return NextResponse.json({
      functions: AVAILABLE_FUNCTIONS.map(f => ({
        name: f.name,
        description: f.description,
        parameters: f.parameters
      })),
      count: AVAILABLE_FUNCTIONS.length
    });
  } catch (error) {
    console.error('Error listing functions:', error);
    return NextResponse.json(
      { error: 'Failed to list functions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/functions
 * Execute one or more functions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle single function call
    if (body.name && body.parameters) {
      const result = await executeFunction({
        name: body.name,
        parameters: body.parameters
      });

      logFunctionExecution(result);

      return NextResponse.json(result, {
        status: result.success ? 200 : 400
      });
    }

    // Handle multiple function calls
    if (Array.isArray(body.calls)) {
      const results = await executeFunctions(body.calls);

      results.forEach(logFunctionExecution);

      return NextResponse.json({
        results,
        totalExecuted: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });
    }

    return NextResponse.json(
      { error: 'Invalid request format. Expected {name, parameters} or {calls: [...]}' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error executing function:', error);
    return NextResponse.json(
      { error: 'Function execution failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
