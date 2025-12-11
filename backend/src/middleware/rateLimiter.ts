import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Rate limiting middleware using Redis
 * Implements a sliding window rate limiter
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old entries outside the current window
      await redisClient.zRemRangeByScore(key, 0, windowStart);

      // Count requests in current window
      const requestCount = await redisClient.zCard(key);

      if (requestCount >= maxRequests) {
        throw new AppError(
          429,
          'RATE_LIMIT_EXCEEDED',
          'Too many requests',
          `You have exceeded the rate limit of ${maxRequests} requests per ${windowMs / 1000} seconds`,
          'Please wait a moment before trying again'
        );
      }

      // Add current request to the window
      await redisClient.zAdd(key, {
        score: now,
        value: `${now}:${Math.random()}`,
      });

      // Set expiry on the key
      await redisClient.expire(key, Math.ceil(windowMs / 1000));

      // If we should skip successful requests, remove this entry after response
      if (skipSuccessfulRequests) {
        res.on('finish', async () => {
          if (res.statusCode < 400) {
            await redisClient.zRem(key, `${now}:${Math.random()}`);
          }
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount - 1));
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // If Redis is down, log error but don't block requests
      logger.error('Rate limiter error:', error);
      next();
    }
  };
};

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  // General API rate limit: 60 requests per minute
  general: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 60,
  }),

  // Authentication endpoints: 5 requests per 15 minutes
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyGenerator: (req: Request) => `auth:${req.ip}`,
  }),

  // AI query endpoints: 20 requests per minute
  ai: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id || req.ip;
      return `ai:${userId}`;
    },
  }),

  // File upload endpoints: 10 requests per minute
  upload: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id || req.ip;
      return `upload:${userId}`;
    },
  }),
};
