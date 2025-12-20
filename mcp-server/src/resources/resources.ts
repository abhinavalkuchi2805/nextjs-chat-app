/**
 * MCP Resources Implementation
 * Exposes read-only data as MCP resources
 */

import { MODEL_CAPABILITIES, getAvailableModels } from '../lib/model-capabilities.js';
import { performanceTracker } from '../lib/performance-tracker.js';

/**
 * Register all MCP resources
 */
export function registerResources(server: any) {
  // Resource 1: Model capabilities
  server.registerResource(
    'model-capabilities',
    'model://capabilities',
    {
      name: 'Model Capabilities',
      description: 'Comprehensive capability matrix for all AI models',
      mimeType: 'application/json'
    },
    async () => {
      return {
        contents: [
          {
            uri: 'model://capabilities',
            mimeType: 'application/json',
            text: JSON.stringify({
              models: MODEL_CAPABILITIES,
              metadata: {
                totalModels: MODEL_CAPABILITIES.length,
                availableModels: MODEL_CAPABILITIES.filter(m => m.available).length,
                providers: [...new Set(MODEL_CAPABILITIES.map(m => m.provider))],
                lastUpdated: new Date().toISOString()
              }
            }, null, 2)
          }
        ]
      };
    }
  );

  // Resource 2: Available models
  server.registerResource(
    'available-models',
    'model://available',
    {
      name: 'Available Models',
      description: 'List of currently available AI models',
      mimeType: 'application/json'
    },
    async () => {
      return {
        contents: [
          {
            uri: 'model://available',
            mimeType: 'application/json',
            text: JSON.stringify({
              models: getAvailableModels(),
              count: getAvailableModels().length
            }, null, 2)
          }
        ]
      };
    }
  );

  // Resource 3: Performance metrics
  server.registerResource(
    'performance-metrics',
    'stats://performance',
    {
      name: 'Performance Metrics',
      description: 'Performance statistics for all models',
      mimeType: 'application/json'
    },
    async () => {
      return {
        contents: [
          {
            uri: 'stats://performance',
            mimeType: 'application/json',
            text: JSON.stringify({
              stats: performanceTracker.getAllStats(),
              totalMetrics: performanceTracker.getMetricCount(),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  );

  // Resource 4: Routing history
  server.registerResource(
    'routing-history',
    'stats://routing-history',
    {
      name: 'Routing History',
      description: 'Recent model routing decisions (last 50)',
      mimeType: 'application/json'
    },
    async () => {
      return {
        contents: [
          {
            uri: 'stats://routing-history',
            mimeType: 'application/json',
            text: JSON.stringify({
              recentMetrics: performanceTracker.getRecentMetrics(50),
              count: Math.min(50, performanceTracker.getMetricCount()),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  );
}
