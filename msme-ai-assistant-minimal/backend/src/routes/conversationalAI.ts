import { Router, Request, Response } from 'express';
import { ConversationalAIService } from '../services/conversationalAIService';
import { authenticate } from '../middleware/auth';
import { ApiResponse, QueryRequest } from '../types';
import { pool } from '../config/database';

const router = Router();

/**
 * POST /api/ai/query
 * Process a natural language query
 */
router.post('/query', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { query, context }: QueryRequest = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query is required and must be a string',
          timestamp: new Date(),
        },
      } as ApiResponse);
    }

    // Fetch user's business profile if not provided in context
    let businessProfile = context?.userBusinessProfile;
    
    if (!businessProfile) {
      const profileResult = await pool.query(
        'SELECT * FROM business_profiles WHERE user_id = $1',
        [userId]
      );
      
      if (profileResult.rows.length > 0) {
        businessProfile = profileResult.rows[0];
      }
    }

    // Process the query
    const response = await ConversationalAIService.processQuery(
      userId,
      query,
      context ? {
        ...context,
        userBusinessProfile: businessProfile,
      } : {
        previousMessages: [],
        userBusinessProfile: businessProfile,
      }
    );

    // Store conversation in database (optional - for history)
    try {
      await pool.query(
        `INSERT INTO conversations (user_id, role, content, timestamp)
         VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)`,
        [
          userId,
          'user',
          query,
          new Date(),
          'assistant',
          response.message,
          new Date(),
        ]
      );
    } catch (error) {
      // Continue even if conversation storage fails
      console.error('Failed to store conversation:', error);
    }

    res.json({
      success: true,
      data: response,
    } as ApiResponse);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'QUERY_PROCESSING_ERROR',
        message: 'Failed to process your query',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try rephrasing your question or try again later',
        timestamp: new Date(),
      },
    } as ApiResponse);
  }
});

/**
 * GET /api/ai/history
 * Get conversation history
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await ConversationalAIService.getConversationHistory(userId, limit);

    res.json({
      success: true,
      data: history,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_FETCH_ERROR',
        message: 'Failed to fetch conversation history',
        timestamp: new Date(),
      },
    } as ApiResponse);
  }
});

/**
 * DELETE /api/ai/context
 * Clear conversation context
 */
router.delete('/context', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    await ConversationalAIService.clearContext(userId);

    res.json({
      success: true,
      data: { message: 'Conversation context cleared' },
    } as ApiResponse);
  } catch (error) {
    console.error('Error clearing context:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTEXT_CLEAR_ERROR',
        message: 'Failed to clear conversation context',
        timestamp: new Date(),
      },
    } as ApiResponse);
  }
});

export default router;
