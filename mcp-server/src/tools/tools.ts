/**
 * MCP Tools Implementation
 * Exposes model selection capabilities as MCP tools
 */

import { z } from 'zod';
import { selectModel, getModelRecommendations, type RouterPreferences } from '../lib/model-router.js';
import { analyzeQuery } from '../lib/model-analyzer.js';

// Tool input schemas
export const SelectModelInputSchema = z.object({
  query: z.string().describe('The user query to analyze and route'),
  preferences: z.object({
    prioritizeCost: z.boolean().optional().describe('Prioritize lower cost models'),
    prioritizeSpeed: z.boolean().optional().describe('Prioritize faster models'),
    prioritizeQuality: z.boolean().optional().describe('Prioritize higher quality models'),
    maxCostPer1M: z.number().optional().describe('Maximum cost per 1M tokens'),
    minSpeed: z.number().optional().describe('Minimum speed rating (0-1)'),
  }).optional()
});

export const AnalyzeQueryInputSchema = z.object({
  query: z.string().describe('The user query to analyze')
});

export const GetRecommendationsInputSchema = z.object({
  query: z.string().describe('The user query to get recommendations for'),
  topN: z.number().optional().default(5).describe('Number of recommendations to return'),
  preferences: z.object({
    prioritizeCost: z.boolean().optional(),
    prioritizeSpeed: z.boolean().optional(),
    prioritizeQuality: z.boolean().optional(),
  }).optional()
});

/**
 * Register all MCP tools
 */
export function registerTools(server: any) {
  // Tool 1: select_model
  server.registerTool(
    'select_model',
    {
      description: 'Select the best AI model for a given query based on complexity, domain, and preferences',
      inputSchema: {
        query: z.string().describe('The user query to analyze and route'),
        preferences: z.object({
          prioritizeCost: z.boolean().optional().describe('Prioritize lower cost models'),
          prioritizeSpeed: z.boolean().optional().describe('Prioritize faster models'),
          prioritizeQuality: z.boolean().optional().describe('Prioritize higher quality models'),
          maxCostPer1M: z.number().optional().describe('Maximum cost per 1M tokens'),
          minSpeed: z.number().optional().describe('Minimum speed rating (0-1)'),
        }).optional()
      }
    },
    async ({ query, preferences }: { query: string; preferences?: any }) => {
      const decision = selectModel(query, preferences as RouterPreferences);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              model: decision.selectedModel,
              provider: decision.selectedProvider,
              displayName: decision.displayName,
              reasoning: decision.reasoning,
              confidence: decision.confidence,
              analysis: {
                complexity: decision.analysis.complexity,
                domain: decision.analysis.domain,
                requirements: decision.analysis.requirements
              }
            }, null, 2)
          }
        ]
      };
    }
  );

  // Tool 2: analyze_query
  server.registerTool(
    'analyze_query',
    {
      description: 'Analyze a query to determine its complexity, domain, and requirements',
      inputSchema: {
        query: z.string().describe('The user query to analyze')
      }
    },
    async ({ query }: { query: string }) => {
      const analysis = analyzeQuery(query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };
    }
  );

  // Tool 3: get_model_recommendations
  server.registerTool(
    'get_model_recommendations',
    {
      description: 'Get a ranked list of recommended models for a query',
      inputSchema: {
        query: z.string().describe('The user query to get recommendations for'),
        topN: z.number().optional().default(5).describe('Number of recommendations to return'),
        preferences: z.object({
          prioritizeCost: z.boolean().optional(),
          prioritizeSpeed: z.boolean().optional(),
          prioritizeQuality: z.boolean().optional(),
        }).optional()
      }
    },
    async ({ query, topN = 5, preferences }: { query: string; topN?: number; preferences?: any }) => {
      const recommendations = getModelRecommendations(
        query,
        topN,
        preferences as RouterPreferences
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ recommendations }, null, 2)
          }
        ]
      };
    }
  );
}
