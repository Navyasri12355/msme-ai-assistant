import { Request, Response } from 'express';
import * as fc from 'fast-check';
import { errorHandler, AppError } from './errorHandler';
import { ErrorResponse } from '../types';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {};
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle AppError with all fields', () => {
      const error = new AppError(
        400,
        'TEST_ERROR',
        'Test error message',
        'Test details',
        'Test suggestion'
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: 'Test details',
          suggestion: 'Test suggestion',
          timestamp: expect.any(Date),
        }),
      });
    });

    it('should handle AppError without optional fields', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Resource not found',
          timestamp: expect.any(Date),
        }),
      });
    });
  });

  describe('Generic error handling', () => {
    it('should handle generic Error', () => {
      const error = new Error('Generic error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          suggestion: expect.any(String),
          timestamp: expect.any(Date),
        }),
      });
    });
  });

  // Feature: msme-ai-assistant, Property 29: Action feedback provision
  // Validates: Requirements 10.3
  describe('Property 29: Action feedback provision', () => {
    it('should always return a response with success field for any error', () => {
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.integer({ min: 400, max: 599 }),
            code: fc.string({ minLength: 1, maxLength: 50 }),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            details: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            suggestion: fc.option(fc.string({ minLength: 0, maxLength: 200 })),
          }),
          (errorData) => {
            // Reset mocks
            jsonMock.mockClear();
            statusMock.mockClear();
            statusMock.mockReturnValue({ json: jsonMock });

            const error = new AppError(
              errorData.statusCode,
              errorData.code,
              errorData.message,
              errorData.details ?? undefined,
              errorData.suggestion ?? undefined
            );

            errorHandler(
              error,
              mockRequest as Request,
              mockResponse as Response,
              mockNext
            );

            // Verify status was called
            expect(statusMock).toHaveBeenCalledWith(errorData.statusCode);

            // Get the response that was sent
            const response = jsonMock.mock.calls[0][0];

            // Property: Response must have success field indicating failure
            expect(response).toHaveProperty('success', false);

            // Property: Response must have error object with feedback
            expect(response).toHaveProperty('error');
            expect(response.error).toHaveProperty('code');
            expect(response.error).toHaveProperty('message');
            expect(response.error).toHaveProperty('timestamp');

            // The error object provides feedback about what happened
            expect(typeof response.error.code).toBe('string');
            expect(typeof response.error.message).toBe('string');
            expect(response.error.code.length).toBeGreaterThan(0);
            expect(response.error.message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide feedback for generic errors', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 200 }), (errorMessage) => {
          // Reset mocks
          jsonMock.mockClear();
          statusMock.mockClear();
          statusMock.mockReturnValue({ json: jsonMock });

          const error = new Error(errorMessage);

          errorHandler(
            error,
            mockRequest as Request,
            mockResponse as Response,
            mockNext
          );

          // Get the response that was sent
          const response = jsonMock.mock.calls[0][0];

          // Property: Even generic errors must provide feedback
          expect(response).toHaveProperty('success', false);
          expect(response).toHaveProperty('error');
          expect(response.error).toHaveProperty('code');
          expect(response.error).toHaveProperty('message');
          expect(response.error).toHaveProperty('suggestion');
          expect(response.error).toHaveProperty('timestamp');

          // Feedback must be meaningful
          expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
          expect(response.error.message.length).toBeGreaterThan(0);
          expect(response.error.suggestion.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: msme-ai-assistant, Property 30: Error message structure
  // Validates: Requirements 10.4
  describe('Property 30: Error message structure', () => {
    it('should include explanation and suggestion for all AppErrors', () => {
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.integer({ min: 400, max: 599 }),
            code: fc.string({ minLength: 1, maxLength: 50 }),
            message: fc.string({ minLength: 1, maxLength: 200 }),
            details: fc.string({ minLength: 1, maxLength: 500 }),
            suggestion: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          (errorData) => {
            // Reset mocks
            jsonMock.mockClear();
            statusMock.mockClear();
            statusMock.mockReturnValue({ json: jsonMock });

            const error = new AppError(
              errorData.statusCode,
              errorData.code,
              errorData.message,
              errorData.details,
              errorData.suggestion
            );

            errorHandler(
              error,
              mockRequest as Request,
              mockResponse as Response,
              mockNext
            );

            // Get the response that was sent
            const response = jsonMock.mock.calls[0][0];
            const errorResponse: ErrorResponse = response.error;

            // Property: Error message must contain explanation (message + details)
            expect(errorResponse.message).toBeDefined();
            expect(errorResponse.message.length).toBeGreaterThan(0);
            expect(errorResponse.details).toBeDefined();
            expect(errorResponse.details!.length).toBeGreaterThan(0);

            // Property: Error message must contain suggestion for how to fix
            expect(errorResponse.suggestion).toBeDefined();
            expect(errorResponse.suggestion!.length).toBeGreaterThan(0);

            // Property: Both explanation and suggestion must be present
            expect(errorResponse.message).toBe(errorData.message);
            expect(errorResponse.details).toBe(errorData.details);
            expect(errorResponse.suggestion).toBe(errorData.suggestion);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide suggestion even for generic errors', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 200 }), (errorMessage) => {
          // Reset mocks
          jsonMock.mockClear();
          statusMock.mockClear();
          statusMock.mockReturnValue({ json: jsonMock });

          const error = new Error(errorMessage);

          errorHandler(
            error,
            mockRequest as Request,
            mockResponse as Response,
            mockNext
          );

          // Get the response that was sent
          const response = jsonMock.mock.calls[0][0];
          const errorResponse: ErrorResponse = response.error;

          // Property: Even unexpected errors must have explanation and suggestion
          expect(errorResponse.message).toBeDefined();
          expect(errorResponse.message.length).toBeGreaterThan(0);
          expect(errorResponse.suggestion).toBeDefined();
          expect(errorResponse.suggestion!.length).toBeGreaterThan(0);

          // The suggestion should be helpful
          expect(errorResponse.suggestion).toContain('try again');
        }),
        { numRuns: 100 }
      );
    });
  });
});
