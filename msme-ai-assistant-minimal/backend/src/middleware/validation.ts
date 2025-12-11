import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Validation middleware using Zod schemas
 * Validates request body, query params, or params
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      
      const validated = schema.parse(dataToValidate);
      
      // Replace the source with validated data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated as any;
      } else {
        req.params = validated as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        
        logger.warn('Validation error:', {
          source,
          errors: error.errors,
          path: req.path,
        });
        
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid request data',
          details,
          'Please check your input and try again'
        );
      }
      next(error);
    }
  };
};

/**
 * Sanitize input to prevent common injection attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential script tags and SQL injection patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

/**
 * Validate required fields in request
 */
export const requireFields = (fields: string[], source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const missing: string[] = [];
    
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new AppError(
        400,
        'MISSING_FIELDS',
        'Required fields are missing',
        `Missing fields: ${missing.join(', ')}`,
        `Please provide the following fields: ${missing.join(', ')}`
      );
    }
    
    next();
  };
};
