/**
 * Model Router
 * Intelligently routes queries to the optimal AI model
 */

import { analyzeQuery, calculatePriorityScores, type QueryAnalysis } from './model-analyzer';
import { getAvailableModels, type ModelCapability } from './model-capabilities';

export interface RouterPreferences {
  prioritizeCost?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeQuality?: boolean;
  maxCostPer1M?: number;
  minSpeed?: number;
}

export interface ModelRecommendation {
  model: string;
  provider: string;
  displayName: string;
  score: number;
  reasoning: string;
  costEstimate?: number;
}

export interface RoutingDecision {
  selectedModel: string;
  selectedProvider: string;
  displayName: string;
  analysis: QueryAnalysis;
  recommendations: ModelRecommendation[];
  reasoning: string;
  confidence: number;
}

/**
 * Select the best model for a given query
 */
export function selectModel(
  query: string,
  preferences: RouterPreferences = {}
): RoutingDecision {
  // Analyze the query
  const analysis = analyzeQuery(query);
  const priorityScores = calculatePriorityScores(analysis);

  // Get all available models
  const availableModels = getAvailableModels();

  // Score each model
  const recommendations = scoreModels(
    availableModels,
    priorityScores,
    preferences,
    analysis
  );

  // Sort by score (descending)
  recommendations.sort((a, b) => b.score - a.score);

  // Select the best model
  const best = recommendations[0];

  // Calculate overall confidence
  const confidence = Math.min(
    analysis.confidence * 0.7 + (best.score / 100) * 0.3,
    0.95
  );

  return {
    selectedModel: best.model,
    selectedProvider: best.provider,
    displayName: best.displayName,
    analysis,
    recommendations: recommendations.slice(0, 5), // Top 5
    reasoning: generateReasoning(best, analysis, preferences),
    confidence
  };
}

/**
 * Score all models based on query characteristics and preferences
 */
function scoreModels(
  models: ModelCapability[],
  priorityScores: ReturnType<typeof calculatePriorityScores>,
  preferences: RouterPreferences,
  analysis: QueryAnalysis
): ModelRecommendation[] {
  return models.map(model => {
    let score = 0;
    const reasons: string[] = [];

    // Score based on capability match
    score += model.speed * priorityScores.speed * 20;
    score += model.reasoning * priorityScores.reasoning * 25;
    score += model.coding * priorityScores.coding * 20;
    score += model.creative * priorityScores.creative * 15;
    score += model.analytics * priorityScores.analytics * 15;

    // Apply preference modifiers
    if (preferences.prioritizeCost) {
      // Heavily favor free/cheap models
      const costScore = model.costPer1MInput === 0 ? 20 : Math.max(0, 20 - model.costPer1MInput);
      score += costScore;
      if (model.costPer1MInput === 0) {
        reasons.push('zero cost');
      }
    }

    if (preferences.prioritizeSpeed) {
      score += model.speed * 25;
      if (model.speed > 0.9) {
        reasons.push('very fast');
      }
    }

    if (preferences.prioritizeQuality) {
      score += model.reasoning * 30;
      if (model.reasoning > 0.9) {
        reasons.push('high quality reasoning');
      }
    }

    // Filter by constraints
    if (preferences.maxCostPer1M && model.costPer1MInput > preferences.maxCostPer1M) {
      score *= 0.3; // Heavy penalty for exceeding cost limit
      reasons.push('exceeds cost limit');
    }

    if (preferences.minSpeed && model.speed < preferences.minSpeed) {
      score *= 0.5; // Penalty for being too slow
    }

    // Check context window requirements
    if (analysis.requirements.needsLongContext && model.contextWindow < 32000) {
      score *= 0.7; // Penalty for small context window
    } else if (analysis.requirements.needsLongContext && model.contextWindow >= 100000) {
      reasons.push('large context window');
    }

    // Add strength-based reasons
    if (model.coding > 0.9 && priorityScores.coding > 0.8) {
      reasons.push('excellent at coding');
    }
    if (model.creative > 0.9 && priorityScores.creative > 0.8) {
      reasons.push('excellent at creative tasks');
    }
    if (model.reasoning > 0.9 && priorityScores.reasoning > 0.8) {
      reasons.push('excellent reasoning ability');
    }

    // Calculate cost estimate
    const costEstimate = analysis.estimatedTokens *
      (model.costPer1MInput + model.costPer1MOutput) / 1_000_000;

    return {
      model: model.model,
      provider: model.provider,
      displayName: model.displayName,
      score: Math.round(score),
      reasoning: reasons.length > 0 ? reasons.join(', ') : 'balanced capabilities',
      costEstimate: costEstimate > 0 ? costEstimate : undefined
    };
  });
}

/**
 * Generate human-readable reasoning for the selection
 */
function generateReasoning(
  selected: ModelRecommendation,
  analysis: QueryAnalysis,
  preferences: RouterPreferences
): string {
  const parts: string[] = [];

  // Query analysis
  parts.push(`Query is ${analysis.complexity} complexity ${analysis.domain} task`);

  // Model selection reason
  parts.push(`Selected ${selected.displayName} because: ${selected.reasoning}`);

  // Preferences applied
  if (preferences.prioritizeCost) {
    parts.push('cost optimization enabled');
  }
  if (preferences.prioritizeSpeed) {
    parts.push('speed optimization enabled');
  }
  if (preferences.prioritizeQuality) {
    parts.push('quality optimization enabled');
  }

  return parts.join('. ') + '.';
}

/**
 * Get ranked recommendations for a query
 */
export function getModelRecommendations(
  query: string,
  topN: number = 5,
  preferences: RouterPreferences = {}
): ModelRecommendation[] {
  const decision = selectModel(query, preferences);
  return decision.recommendations.slice(0, topN);
}
