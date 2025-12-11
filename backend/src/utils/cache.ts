import { redisClient } from '../config/redis';

/**
 * Cache utility for managing Redis caching operations
 */
export class CacheService {
  /**
   * Get a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL (time to live) in seconds
   */
  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if a key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set a value in cache
   * If the key exists, return the cached value
   * Otherwise, execute the callback, cache the result, and return it
   */
  static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    callback: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute callback to get fresh data
    const result = await callback();

    // Cache the result
    await this.set(key, result, ttlSeconds);

    return result;
  }
}

/**
 * Cache key generators for different data types
 */
export class CacheKeys {
  /**
   * Dashboard data cache key
   */
  static dashboardData(userId: string): string {
    return `dashboard:${userId}`;
  }

  /**
   * Dashboard metrics cache key
   */
  static dashboardMetrics(userId: string): string {
    return `dashboard:metrics:${userId}`;
  }

  /**
   * Dashboard trends cache key
   */
  static dashboardTrends(userId: string, metrics: string[]): string {
    return `dashboard:trends:${userId}:${metrics.sort().join(',')}`;
  }

  /**
   * Dashboard insights cache key
   */
  static dashboardInsights(userId: string): string {
    return `dashboard:insights:${userId}`;
  }

  /**
   * Marketing strategies cache key
   */
  static marketingStrategies(userId: string, budget?: number): string {
    const budgetStr = budget !== undefined ? budget.toString() : 'all';
    return `marketing:strategies:${userId}:${budgetStr}`;
  }

  /**
   * Content suggestions cache key
   */
  static contentSuggestions(userId: string, count: number): string {
    return `marketing:content:${userId}:${count}`;
  }

  /**
   * Sentiment analysis cache key
   */
  static sentimentAnalysis(feedbackHash: string): string {
    return `marketing:sentiment:${feedbackHash}`;
  }

  /**
   * Pattern to match all dashboard keys for a user
   */
  static dashboardPattern(userId: string): string {
    return `dashboard:*:${userId}*`;
  }

  /**
   * Pattern to match all marketing keys for a user
   */
  static marketingPattern(userId: string): string {
    return `marketing:*:${userId}*`;
  }
}

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  DASHBOARD_DATA: 5 * 60, // 5 minutes
  MARKETING_STRATEGIES: 60 * 60, // 1 hour
  SENTIMENT_ANALYSIS: 24 * 60 * 60, // 24 hours (indefinite for same feedback)
  CONTENT_SUGGESTIONS: 60 * 60, // 1 hour
};
