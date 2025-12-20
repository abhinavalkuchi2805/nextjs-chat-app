/**
 * Query Analyzer
 * Analyzes user queries to determine complexity, domain, and requirements
 */

export type QueryComplexity = 'simple' | 'moderate' | 'complex';
export type QueryDomain = 'general' | 'coding' | 'creative' | 'analytics' | 'technical';

export interface QueryAnalysis {
  complexity: QueryComplexity;
  domain: QueryDomain;
  requirements: {
    needsLongContext: boolean;
    needsReasoning: boolean;
    needsCreativity: boolean;
    needsCodeGeneration: boolean;
    needsDataAnalysis: boolean;
  };
  estimatedTokens: number;
  confidence: number;
}

// Patterns for complexity detection
const SIMPLE_PATTERNS = [
  /^(what|who|when|where|which|how much|how many)\s+/i,
  /^(define|explain|describe|tell me about)\s+\w+$/i,
  /^(yes|no|thanks|thank you|hi|hello|hey)/i,
];

const COMPLEX_PATTERNS = [
  /\b(analyze|compare|evaluate|synthesize|design|architect|implement)\b/i,
  /\b(explain.*why|explain.*how.*works?|implications?|trade-?offs?)\b/i,
  /\b(multi-?step|complex|intricate|comprehensive)\b/i,
  /\b(algorithm|optimization|performance|architecture)\b/i,
];

// Domain detection patterns
const CODING_KEYWORDS = [
  'code', 'function', 'class', 'api', 'bug', 'debug', 'implement', 'algorithm',
  'typescript', 'javascript', 'python', 'react', 'component', 'refactor',
  'test', 'unit test', 'integration', 'repository', 'git', 'deploy'
];

const CREATIVE_KEYWORDS = [
  'write', 'create', 'story', 'poem', 'article', 'blog', 'creative',
  'imagine', 'brainstorm', 'ideas', 'suggest', 'slogan', 'marketing'
];

const ANALYTICS_KEYWORDS = [
  'data', 'analyze', 'statistics', 'metrics', 'trends', 'insights',
  'calculate', 'measure', 'report', 'dashboard', 'chart', 'graph'
];

const TECHNICAL_KEYWORDS = [
  'system', 'architecture', 'infrastructure', 'database', 'server',
  'scalability', 'performance', 'security', 'optimization', 'protocol'
];

/**
 * Analyze a query to determine its characteristics
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const lowerQuery = query.toLowerCase().trim();
  const wordCount = query.split(/\s+/).length;
  
  // Determine complexity
  let complexity: QueryComplexity;
  if (SIMPLE_PATTERNS.some(pattern => pattern.test(query))) {
    complexity = 'simple';
  } else if (COMPLEX_PATTERNS.some(pattern => pattern.test(query)) || wordCount > 30) {
    complexity = 'complex';
  } else {
    complexity = 'moderate';
  }
  
  // Determine domain
  let domain: QueryDomain = 'general';
  let maxScore = 0;
  
  const scores = {
    coding: countKeywords(lowerQuery, CODING_KEYWORDS),
    creative: countKeywords(lowerQuery, CREATIVE_KEYWORDS),
    analytics: countKeywords(lowerQuery, ANALYTICS_KEYWORDS),
    technical: countKeywords(lowerQuery, TECHNICAL_KEYWORDS),
  };
  
  for (const [key, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      domain = key as QueryDomain;
    }
  }
  
  // Determine requirements
  const requirements = {
    needsLongContext: wordCount > 50 || /\b(document|article|essay|detailed|comprehensive)\b/i.test(query),
    needsReasoning: complexity === 'complex' || /\b(why|how|reason|explain|understand)\b/i.test(query),
    needsCreativity: domain === 'creative' || /\b(creative|innovative|unique|original)\b/i.test(query),
    needsCodeGeneration: domain === 'coding' || /\b(write|create|implement|code|function|class)\b/i.test(query),
    needsDataAnalysis: domain === 'analytics' || /\b(analyze|data|statistics|trends)\b/i.test(query),
  };
  
  // Estimate tokens (rough approximation: 1.3 tokens per word)
  const estimatedTokens = Math.ceil(wordCount * 1.3);
  
  // Calculate confidence based on keyword matches
  const totalKeywords = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = Math.min(0.5 + (totalKeywords * 0.1) + (complexity === 'simple' ? 0.2 : 0.1), 0.95);
  
  return {
    complexity,
    domain,
    requirements,
    estimatedTokens,
    confidence
  };
}

/**
 * Count how many keywords from a list appear in the text
 */
function countKeywords(text: string, keywords: string[]): number {
  return keywords.filter(keyword => text.includes(keyword)).length;
}

/**
 * Calculate priority scores for different model characteristics
 */
export function calculatePriorityScores(analysis: QueryAnalysis): {
  speed: number;
  reasoning: number;
  coding: number;
  creative: number;
  analytics: number;
} {
  const scores = {
    speed: 0.5,
    reasoning: 0.5,
    coding: 0.5,
    creative: 0.5,
    analytics: 0.5,
  };
  
  // Adjust based on complexity
  if (analysis.complexity === 'simple') {
    scores.speed = 0.9;
    scores.reasoning = 0.3;
  } else if (analysis.complexity === 'complex') {
    scores.speed = 0.3;
    scores.reasoning = 0.9;
  }
  
  // Adjust based on domain
  switch (analysis.domain) {
    case 'coding':
      scores.coding = 0.95;
      scores.reasoning = 0.8;
      break;
    case 'creative':
      scores.creative = 0.95;
      scores.reasoning = 0.7;
      break;
    case 'analytics':
      scores.analytics = 0.95;
      scores.reasoning = 0.8;
      break;
    case 'technical':
      scores.reasoning = 0.9;
      scores.coding = 0.7;
      break;
  }
  
  // Adjust based on requirements
  if (analysis.requirements.needsReasoning) {
    scores.reasoning = Math.max(scores.reasoning, 0.8);
  }
  if (analysis.requirements.needsCodeGeneration) {
    scores.coding = Math.max(scores.coding, 0.85);
  }
  if (analysis.requirements.needsCreativity) {
    scores.creative = Math.max(scores.creative, 0.85);
  }
  if (analysis.requirements.needsDataAnalysis) {
    scores.analytics = Math.max(scores.analytics, 0.85);
  }
  
  return scores;
}
