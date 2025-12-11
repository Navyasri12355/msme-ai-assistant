import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { UserModel } from '../models/User';

// Mock dependencies first
jest.mock('../services/authService');
jest.mock('../models/User');

// Import the middleware after mocking
import { authenticate } from './auth';

interface MockRequest extends Partial<Request> {
  user?: {
    userId: string;
    email: string;
  };
}

describe('Authentication Middleware', () => {
  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('Property-Based Tests', () => {
    // Feature: msme-ai-assistant, Property 28: Authorization enforcement
    // Validates: Requirements 9.4
    it('should deny access for any request without valid authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(undefined), // No authorization header
            fc.constant(''), // Empty authorization header
            fc.string().filter(s => !s.startsWith('Bearer ')), // Invalid format
            fc.constant('Bearer'), // Just "Bearer" without token
            fc.constant('Bearer '), // "Bearer " with empty token
          ),
          async (authHeader) => {
            // Setup request with invalid/missing auth
            mockRequest.headers = authHeader ? { authorization: authHeader } : {};

            // Call middleware
            await authenticate(
              mockRequest as Request,
              mockResponse as Response,
              mockNext
            );

            // Property: Request should be denied (401 status)
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
              expect.objectContaining({
                error: expect.objectContaining({
                  code: 'UNAUTHORIZED',
                }),
              })
            );
            
            // Property: Next should NOT be called (request blocked)
            expect(mockNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access for any request with invalid token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }), // Random invalid tokens
          async (invalidToken) => {
            // Setup request with invalid token
            mockRequest.headers = {
              authorization: `Bearer ${invalidToken}`,
            };

            // Mock AuthService to throw error for invalid token
            (AuthService.verifyToken as jest.Mock).mockImplementation(() => {
              throw new Error('Invalid or expired token');
            });

            // Call middleware
            await authenticate(
              mockRequest as Request,
              mockResponse as Response,
              mockNext
            );

            // Property: Request should be denied (401 status)
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
              expect.objectContaining({
                error: expect.objectContaining({
                  code: 'UNAUTHORIZED',
                }),
              })
            );
            
            // Property: Next should NOT be called (request blocked)
            expect(mockNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny access when user does not exist even with valid token format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }), // Token
          fc.uuid(), // User ID
          fc.emailAddress(), // Email
          async (token, userId, email) => {
            // Setup request with token
            mockRequest.headers = {
              authorization: `Bearer ${token}`,
            };

            // Mock valid token verification but user not found
            (AuthService.verifyToken as jest.Mock).mockReturnValue({
              userId,
              email,
            });
            
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            // Call middleware
            await authenticate(
              mockRequest as Request,
              mockResponse as Response,
              mockNext
            );

            // Property: Request should be denied (401 status)
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
              expect.objectContaining({
                error: expect.objectContaining({
                  code: 'UNAUTHORIZED',
                  message: 'User not found',
                }),
              })
            );
            
            // Property: Next should NOT be called (request blocked)
            expect(mockNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should allow access with valid token and existing user', async () => {
      const token = 'valid-token-123';
      const userId = 'user-123';
      const email = 'test@example.com';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (AuthService.verifyToken as jest.Mock).mockReturnValue({
        userId,
        email,
      });

      (UserModel.findById as jest.Mock).mockResolvedValue({
        id: userId,
        email,
        passwordHash: 'hashed',
        createdAt: new Date(),
        lastLogin: null,
      });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        userId,
        email,
      });
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
