import { Router, Request, Response } from 'express';
import { MarketingService } from '../services/marketingService';
import { BusinessProfileModel } from '../models/BusinessProfile';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schemas
const strategyRequestSchema = z.object({
  budget: z.number().positive().optional(),
});

const contentRequestSchema = z.object({
  count: z.number().int().positive().optional(),
});

const sentimentRequestSchema = z.object({
  feedback: z.array(
    z.object({
      text: z.string().min(1),
      language: z.string().optional(),
      source: z.string().optional(),
    })
  ).min(1),
});

/**
 * POST /api/marketing/strategies
 * Generate marketing strategies for the user's business
 */
router.post('/strategies', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = strategyRequestSchema.parse(req.body);

    // Get user's business profile
    const businessProfile = await BusinessProfileModel.findByUserId(req.user!.userId);

    if (!businessProfile) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Business profile not found',
          suggestion: 'Create a business profile first using POST /api/profile',
          timestamp: new Date(),
        },
      });
      return;
    }

    // Generate strategies (businessProfile already has userId)
    const strategies = await MarketingService.generateStrategies(
      businessProfile,
      validatedData.budget
    );

    res.status(200).json({
      success: true,
      data: { strategies },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          suggestion: 'Budget must be a positive number if provided',
          timestamp: new Date(),
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        error: {
          code: 'STRATEGY_GENERATION_FAILED',
          message: error.message,
          suggestion: 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while generating strategies',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

/**
 * POST /api/marketing/content-suggestions
 * Generate content suggestions for the user's business
 */
router.post('/content-suggestions', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = contentRequestSchema.parse(req.body);

    // Get user's business profile
    const businessProfile = await BusinessProfileModel.findByUserId(req.user!.userId);

    if (!businessProfile) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Business profile not found',
          suggestion: 'Create a business profile first using POST /api/profile',
          timestamp: new Date(),
        },
      });
      return;
    }

    // Generate content suggestions
    const suggestions = await MarketingService.suggestContent(
      businessProfile,
      validatedData.count
    );

    res.status(200).json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          suggestion: 'Count must be a positive integer if provided',
          timestamp: new Date(),
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        error: {
          code: 'CONTENT_GENERATION_FAILED',
          message: error.message,
          suggestion: 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while generating content suggestions',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

/**
 * GET /api/marketing/content-outline/:contentId
 * Get detailed outline for a specific content suggestion
 */
router.get('/content-outline/:contentId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      res.status(400).json({
        error: {
          code: 'MISSING_CONTENT_ID',
          message: 'Content ID is required',
          suggestion: 'Provide a valid content ID in the URL',
          timestamp: new Date(),
        },
      });
      return;
    }

    // Get content outline
    const outline = await MarketingService.getContentOutline(contentId);

    res.status(200).json({
      success: true,
      data: { outline },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        error: {
          code: 'OUTLINE_RETRIEVAL_FAILED',
          message: error.message,
          suggestion: 'Please check the content ID and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving content outline',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

/**
 * POST /api/marketing/sentiment-analysis
 * Analyze customer sentiment from feedback
 */
router.post('/sentiment-analysis', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = sentimentRequestSchema.parse(req.body);

    // Convert to CustomerFeedback format
    const customerFeedback = validatedData.feedback.map((item, index) => ({
      id: `feedback-${Date.now()}-${index}`,
      text: item.text,
      language: item.language || 'en',
      source: item.source || 'manual',
      date: new Date(),
    }));

    // Analyze sentiment
    const analysis = await MarketingService.analyzeSentiment(customerFeedback);

    res.status(200).json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          suggestion: 'Feedback must be an array of objects with text field',
          timestamp: new Date(),
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        error: {
          code: 'SENTIMENT_ANALYSIS_FAILED',
          message: error.message,
          suggestion: 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while analyzing sentiment',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

export default router;
