import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { pool } from '../config/database';
import { ApiResponse } from '../types';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * GET /api/user/profile
 * Get user profile information
 */
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const userResult = await pool.query(
      'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date(),
        },
      } as ApiResponse);
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_ERROR',
        message: 'Failed to fetch user profile',
        details: error.message,
        timestamp: new Date(),
      },
    } as ApiResponse);
  }
});

/**
 * PUT /api/user/profile
 * Update user profile information
 */
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
          timestamp: new Date(),
        },
      } as ApiResponse);
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Email is already taken by another user',
            timestamp: new Date(),
          },
        } as ApiResponse);
      }
    }

    // Update user profile
    const updateResult = await pool.query(
      'UPDATE users SET email = COALESCE($1, email), updated_at = NOW() WHERE id = $2 RETURNING id, email, created_at, updated_at',
      [email, userId]
    );

    const updatedUser = updateResult.rows[0];

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_UPDATE_ERROR',
        message: 'Failed to update user profile',
        details: error.message,
        timestamp: new Date(),
      },
    } as ApiResponse);
  }
});

/**
 * POST /api/user/change-password
 * Change user password
 */
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORDS',
          message: 'Current password and new password are required',
          timestamp: new Date(),
        },
      } as ApiResponse);
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must be at least 6 characters long',
          timestamp: new Date(),
        },
      } as ApiResponse);
    }

    // Get current user
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date(),
        },
      } as ApiResponse);
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect',
          timestamp: new Date(),
        },
      } as ApiResponse);
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      data: {
        message: 'Password changed successfully',
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: 'Failed to change password',
        details: error.message,
        timestamp: new Date(),
      },
    } as ApiResponse);
  }
});

/**
 * GET /api/user/stats
 * Get user account statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get transaction count
    const transactionResult = await pool.query(
      'SELECT COUNT(*) as transaction_count FROM transactions WHERE user_id = $1',
      [userId]
    );

    // Get conversation count (if conversations table exists)
    let conversationCount = 0;
    try {
      const conversationResult = await pool.query(
        'SELECT COUNT(DISTINCT conversation_id) as conversation_count FROM conversations WHERE user_id = $1',
        [userId]
      );
      conversationCount = parseInt(conversationResult.rows[0]?.conversation_count || '0');
    } catch (error) {
      // Conversations table might not exist yet
      console.log('Conversations table not found, defaulting to 0');
    }

    // Get business insights count (mock for now)
    const insightsCount = Math.floor(Math.random() * 50) + 10; // Mock data

    res.json({
      success: true,
      data: {
        transactionCount: parseInt(transactionResult.rows[0].transaction_count),
        conversationCount,
        insightsCount,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_FETCH_ERROR',
        message: 'Failed to fetch user statistics',
        details: error.message,
        timestamp: new Date(),
      },
    } as ApiResponse);
  }
});

export default router;