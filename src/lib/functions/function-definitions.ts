/**
 * Function Definitions for AI Agents
 * Defines all available functions that AI can call
 */

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: any;
    }>;
    required: string[];
  };
}

/**
 * All available functions for AI agents
 */
export const AVAILABLE_FUNCTIONS: FunctionDefinition[] = [
  {
    name: "search_vector_database",
    description: "Search uploaded documents and data using vector similarity search. Use this when users ask about uploaded content, documents, or want to find relevant information from their data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query or question to find relevant information"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (1-20)",
          default: 5
        },
        threshold: {
          type: "number",
          description: "Similarity threshold (0-1). Higher values return only very similar results",
          default: 0.7
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_statistics",
    description: "Get analytics, metrics, and statistics from the database. Use this for questions about counts, trends, summaries, or data analysis.",
    parameters: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          description: "Type of metric to retrieve",
          enum: ["document_count", "search_count", "upload_stats", "user_activity", "query_trends"]
        },
        timeRange: {
          type: "string",
          description: "Time range for the statistics",
          enum: ["today", "week", "month", "all"],
          default: "week"
        },
        groupBy: {
          type: "string",
          description: "Optional grouping dimension",
          enum: ["day", "week", "type", "user"]
        }
      },
      required: ["metric"]
    }
  },
  {
    name: "summarize_content",
    description: "Generate a summary of long text content, documents, or conversation history. Use this when users ask to summarize, condense, or get key points.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The content to summarize"
        },
        length: {
          type: "string",
          description: "Desired summary length",
          enum: ["brief", "medium", "detailed"],
          default: "medium"
        },
        format: {
          type: "string",
          description: "Output format",
          enum: ["paragraph", "bullet_points", "key_facts"],
          default: "paragraph"
        },
        focus: {
          type: "string",
          description: "Optional focus area for the summary (e.g., 'trends', 'issues', 'recommendations')"
        }
      },
      required: ["content"]
    }
  },
  {
    name: "export_data",
    description: "Export search results, query results, or data in various formats (JSON, CSV, Markdown). Use this when users want to download or export data.",
    parameters: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description: "The data to export (JSON string or identifier)"
        },
        format: {
          type: "string",
          description: "Export format",
          enum: ["json", "csv", "markdown", "text"],
          default: "json"
        },
        filename: {
          type: "string",
          description: "Optional filename for the export"
        },
        includeMetadata: {
          type: "boolean",
          description: "Include metadata like timestamps, sources",
          default: true
        }
      },
      required: ["data", "format"]
    }
  },
  {
    name: "get_file_info",
    description: "Get information about uploaded files and documents. Use this when users ask about their uploads, file details, or want to list files.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "Type of file operation",
          enum: ["list_all", "get_details", "search_by_name", "get_recent"],
          default: "list_all"
        },
        fileId: {
          type: "string",
          description: "Specific file ID (for get_details operation)"
        },
        searchTerm: {
          type: "string",
          description: "Search term for file names (for search_by_name)"
        },
        limit: {
          type: "number",
          description: "Maximum number of files to return",
          default: 10
        }
      },
      required: ["operation"]
    }
  }
];

/**
 * Get function definition by name
 */
export function getFunctionDefinition(name: string): FunctionDefinition | undefined {
  return AVAILABLE_FUNCTIONS.find(f => f.name === name);
}

/**
 * Validate function parameters against definition
 */
export function validateFunctionParams(
  functionName: string,
  params: Record<string, any>
): { valid: boolean; errors: string[] } {
  const definition = getFunctionDefinition(functionName);
  
  if (!definition) {
    return { valid: false, errors: [`Unknown function: ${functionName}`] };
  }

  const errors: string[] = [];

  // Check required parameters
  for (const required of definition.parameters.required) {
    if (!(required in params)) {
      errors.push(`Missing required parameter: ${required}`);
    }
  }

  // Validate parameter types and enums
  for (const [key, value] of Object.entries(params)) {
    const paramDef = definition.parameters.properties[key];
    
    if (!paramDef) {
      errors.push(`Unknown parameter: ${key}`);
      continue;
    }

    // Type checking
    const actualType = typeof value;
    if (paramDef.type === 'number' && actualType !== 'number') {
      errors.push(`Parameter '${key}' must be a number`);
    }
    if (paramDef.type === 'string' && actualType !== 'string') {
      errors.push(`Parameter '${key}' must be a string`);
    }
    if (paramDef.type === 'boolean' && actualType !== 'boolean') {
      errors.push(`Parameter '${key}' must be a boolean`);
    }

    // Enum validation
    if (paramDef.enum && !paramDef.enum.includes(value)) {
      errors.push(`Parameter '${key}' must be one of: ${paramDef.enum.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
