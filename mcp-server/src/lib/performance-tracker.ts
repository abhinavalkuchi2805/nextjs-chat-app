/**
 * Performance Tracker
 * Tracks model performance metrics over time
 */

export interface PerformanceMetric {
  model: string;
  provider: string;
  timestamp: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  tokenCount?: number;
}

export interface ModelStats {
  model: string;
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  totalTokens: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  
  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  
  /**
   * Get statistics for a specific model
   */
  getModelStats(model: string): ModelStats | null {
    const modelMetrics = this.metrics.filter(m => m.model === model);
    
    if (modelMetrics.length === 0) {
      return null;
    }
    
    const successful = modelMetrics.filter(m => m.success);
    const failed = modelMetrics.filter(m => !m.success);
    
    const totalResponseTime = successful.reduce((sum, m) => sum + m.responseTime, 0);
    const totalTokens = successful.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
    
    return {
      model,
      provider: modelMetrics[0].provider,
      totalRequests: modelMetrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: successful.length / modelMetrics.length,
      averageResponseTime: totalResponseTime / successful.length || 0,
      totalTokens
    };
  }
  
  /**
   * Get statistics for all models
   */
  getAllStats(): ModelStats[] {
    const uniqueModels = [...new Set(this.metrics.map(m => m.model))];
    return uniqueModels
      .map(model => this.getModelStats(model))
      .filter((stats): stats is ModelStats => stats !== null);
  }
  
  /**
   * Get recent metrics (last N)
   */
  getRecentMetrics(count: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }
  
  /**
   * Get metrics within a time range
   */
  getMetricsInRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
  
  /**
   * Get total number of tracked metrics
   */
  getMetricCount(): number {
    return this.metrics.length;
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();
