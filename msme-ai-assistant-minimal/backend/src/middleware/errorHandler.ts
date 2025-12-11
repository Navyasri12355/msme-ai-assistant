import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    // Log application errors
    logger.warn(`AppError: ${err.code} - ${err.message}`, {
      statusCode: err.statusCode,
      details: err.details,
      stack: err.stack,
    });

    const errorResponse: ErrorResponse = {
      code: err.code,
      message: err.message,
      details: err.details,
      suggestion: err.suggestion,
      timestamp: new Date(),
    };

    return res.status(err.statusCode).json({
      success: false,
      error: errorResponse,
    });
  }

  // Handle unexpected errors
  logger.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });
  
  const errorResponse: ErrorResponse = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    suggestion: 'Please try again later or contact support if the problem persists',
    timestamp: new Date(),
  };

  return res.status(500).json({
    success: false,
    error: errorResponse,
  });
};
