import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const { user, tokens } = await AuthService.register(
      validatedData.email,
      validatedData.password
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        tokens,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => e.message).join(', '),
          suggestion: 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    if (error instanceof Error) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        error: {
          code: statusCode === 409 ? 'USER_EXISTS' : 'REGISTRATION_FAILED',
          message: error.message,
          suggestion: statusCode === 409 
            ? 'Try logging in instead or use a different email'
            : 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during registration',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const { user, tokens } = await AuthService.login(
      validatedData.email,
      validatedData.password
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          lastLogin: user.lastLogin,
        },
        tokens,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => e.message).join(', '),
          suggestion: 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(401).json({
        error: {
          code: 'LOGIN_FAILED',
          message: error.message,
          suggestion: 'Please check your email and password and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during login',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = refreshTokenSchema.parse(req.body);

    // Refresh tokens
    const tokens = await AuthService.refreshAccessToken(validatedData.refreshToken);

    res.status(200).json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => e.message).join(', '),
          suggestion: 'Please provide a valid refresh token',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(401).json({
      error: {
        code: 'REFRESH_FAILED',
        message: 'Invalid or expired refresh token',
        suggestion: 'Please log in again',
        timestamp: new Date(),
      },
    });
  }
});

export default router;
