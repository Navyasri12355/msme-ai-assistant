import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { UserModel } from '../models/User';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: 'No valid authorization token provided',
          suggestion: 'Include a valid Bearer token in the Authorization header',
          timestamp: new Date(),
        },
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    const user = await UserModel.findById(payload.userId);
    
    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
          details: 'The user associated with this token no longer exists',
          suggestion: 'Please log in again',
          timestamp: new Date(),
        },
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        details: error instanceof Error ? error.message : 'Token verification failed',
        suggestion: 'Please log in again to get a new token',
        timestamp: new Date(),
      },
    });
  }
}
