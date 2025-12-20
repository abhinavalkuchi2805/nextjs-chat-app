/**
 * Function Executor - Safely executes function calls from AI
 */

import { validateFunctionParams } from './function-definitions';
import {
  executeVectorSearch,
  getStatistics,
  summarizeContent,
  exportData,
  getFileInfo,
  type FunctionResult
} from './function-handlers';

export interface FunctionCall {
  name: string;
  parameters: Record<string, any>;
}

export interface ExecutionResult extends FunctionResult {
  functionName: string;
  executionTime: number;
  timestamp: string;
}

/**
 * Execute a function call safely with validation and error handling
 */
export async function executeFunction(call: FunctionCall): Promise<ExecutionResult> {
  const startTime = Date.now();
  const { name, parameters } = call;

  try {
    // Validate parameters
    const validation = validateFunctionParams(name, parameters);
    if (!validation.valid) {
      return {
        functionName: name,
        success: false,
        error: `Parameter validation failed: ${validation.errors.join(', ')}`,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    // Execute the appropriate function
    let result: FunctionResult;

    switch (name) {
      case 'search_vector_database':
        result = await executeVectorSearch(parameters);
        break;

      case 'get_statistics':
        result = await getStatistics(parameters);
        break;

      case 'summarize_content':
        result = await summarizeContent(parameters);
        break;

      case 'export_data':
        result = await exportData(parameters);
        break;

      case 'get_file_info':
        result = await getFileInfo(parameters);
        break;

      default:
        result = {
          success: false,
          error: `Unknown function: ${name}`
        };
    }

    return {
      ...result,
      functionName: name,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      functionName: name,
      success: false,
      error: `Function execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Execute multiple function calls in sequence
 */
export async function executeFunctions(calls: FunctionCall[]): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  for (const call of calls) {
    const result = await executeFunction(call);
    results.push(result);

    // Stop on first error if configured
    if (!result.success) {
      console.error(`Function ${call.name} failed:`, result.error);
    }
  }

  return results;
}

/**
 * Format function result for AI consumption
 */
export function formatResultForAI(result: ExecutionResult): string {
  if (!result.success) {
    return `Error executing ${result.functionName}: ${result.error}`;
  }

  return JSON.stringify({
    function: result.functionName,
    result: result.data,
    metadata: result.metadata,
    executionTime: `${result.executionTime}ms`
  }, null, 2);
}

/**
 * Log function execution for monitoring
 */
export function logFunctionExecution(result: ExecutionResult): void {
  const logLevel = result.success ? 'info' : 'error';
  const message = result.success 
    ? `✓ ${result.functionName} completed in ${result.executionTime}ms`
    : `✗ ${result.functionName} failed: ${result.error}`;

  console[logLevel]('[Function Executor]', message);

  // In production, you might want to send this to a logging service
  // e.g., trackFunctionCall({ ...result });
}
