/**
 * MCP Client for Next.js Integration
 * Simplified version that uses model router directly
 */

import { selectModel, getModelRecommendations } from '../../mcp-server/src/lib/model-router';
import { analyzeQuery } from '../../mcp-server/src/lib/model-analyzer';
import type { RouterPreferences } from '../../mcp-server/src/lib/model-router';

export interface ModelSelection {
  model: string;
  provider: string;
  displayName: string;
  reasoning: string;
  confidence: number;
  analysis?: {
    complexity: string;
    domain: string;
    requirements: Record<string, boolean>;
  };
}

export interface ModelRecommendation {
  model: string;
  provider: string;
  displayName: string;
  score: number;
  reasoning: string;
  costEstimate?: number;
}

/**
 * Select the best model for a query
 * This is a simplified version that calls the router directly
 */
export async function selectBestModel(
  query: string,
  preferences?: {
    prioritizeCost?: boolean;
    prioritizeSpeed?: boolean;
    prioritizeQuality?: boolean;
  }
): Promise<ModelSelection | null> {
  try {
    // Call the model router directly
    const decision = selectModel(query, preferences as RouterPreferences);
    
    return {
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
    };
  } catch (error) {
    console.error('Model selection failed:', error);
    return null;
  }
}

/**
 * Analyze a query
 */
export async function analyzeQueryCharacteristics(query: string): Promise<any> {
  try {
    return analyzeQuery(query);
  } catch (error) {
    console.error('Query analysis failed:', error);
    return null;
  }
}

/**
 * Get model recommendations
 */
export async function getModelRecommendationsList(
  query: string,
  topN: number = 5,
  preferences?: {
    prioritizeCost?: boolean;
    prioritizeSpeed?: boolean;
    prioritizeQuality?: boolean;
  }
): Promise<ModelRecommendation[]> {
  try {
    return getModelRecommendations(query, topN, preferences as RouterPreferences);
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}
