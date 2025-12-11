import { Router, Request, Response } from 'express';
import { BusinessProfileModel } from '../models/BusinessProfile';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { CacheService, CacheKeys } from '../utils/cache';

const router = Router();

// Valid business types and industries (can be expanded)
const VALID_BUSINESS_TYPES = [
  'retail',
  'restaurant',
  'service',
  'manufacturing',
  'wholesale',
  'e-commerce',
  'consulting',
  'other',
] as const;

const VALID_INDUSTRIES = [
  'food-beverage',
  'retail',
  'technology',
  'healthcare',
  'education',
  'construction',
  'agriculture',
  'textiles',
  'automotive',
  'hospitality',
  'professional-services',
  'other',
] as const;

// Validation schemas
const createProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(255),
  businessType: z.enum(VALID_BUSINESS_TYPES, {
    errorMap: () => ({ message: 'Invalid business type' }),
  }),
  industry: z.enum(VALID_INDUSTRIES, {
    errorMap: () => ({ message: 'Invalid industry' }),
  }),
  location: z.string().min(1, 'Location is required').max(255),
  targetAudience: z.string().min(1, 'Target audience is required'),
  monthlyRevenue: z.number().positive().optional(),
  employeeCount: z.number().int().positive('Employee count must be positive'),
  establishedDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    },
    { message: 'Established date must be a valid date in the past' }
  ),
});

const updateProfileSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  businessType: z.enum(VALID_BUSINESS_TYPES).optional(),
  industry: z.enum(VALID_INDUSTRIES).optional(),
  location: z.string().min(1).max(255).optional(),
  targetAudience: z.string().min(1).optional(),
  monthlyRevenue: z.number().positive().optional(),
  employeeCount: z.number().int().positive().optional(),
  establishedDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    },
    { message: 'Established date must be a valid date in the past' }
  ).optional(),
});

/**
 * POST /api/profile
 * Create a new business profile
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createProfileSchema.parse(req.body);

    // Check if profile already exists
    const existingProfile = await BusinessProfileModel.findByUserId(req.user!.userId);
    if (existingProfile) {
      res.status(409).json({
        error: {
          code: 'PROFILE_EXISTS',
          message: 'Business profile already exists for this user',
          suggestion: 'Use PUT /api/profile to update your existing profile',
          timestamp: new Date(),
        },
      });
      return;
    }

    // Create profile
    const profile = await BusinessProfileModel.create({
      userId: req.user!.userId,
      businessName: validatedData.businessName,
      businessType: validatedData.businessType,
      industry: validatedData.industry,
      location: validatedData.location,
      targetAudience: validatedData.targetAudience,
      monthlyRevenue: validatedData.monthlyRevenue,
      employeeCount: validatedData.employeeCount,
      establishedDate: new Date(validatedData.establishedDate),
    });

    // Invalidate marketing cache since business profile changed
    await CacheService.deletePattern(CacheKeys.marketingPattern(req.user!.userId));

    res.status(201).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          suggestion: 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        error: {
          code: 'PROFILE_CREATION_FAILED',
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
        message: 'An unexpected error occurred while creating profile',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

/**
 * GET /api/profile
 * Get the current user's business profile
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await BusinessProfileModel.findByUserId(req.user!.userId);

    if (!profile) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Business profile not found',
          suggestion: 'Create a profile using POST /api/profile',
          timestamp: new Date(),
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving profile',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

/**
 * PUT /api/profile
 * Update the current user's business profile
 */
router.put('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    // Check if profile exists
    const existingProfile = await BusinessProfileModel.findByUserId(req.user!.userId);
    if (!existingProfile) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Business profile not found',
          suggestion: 'Create a profile using POST /api/profile first',
          timestamp: new Date(),
        },
      });
      return;
    }

    // Update profile
    const updateData: any = { ...validatedData };
    if (validatedData.establishedDate) {
      updateData.establishedDate = new Date(validatedData.establishedDate);
    }

    const profile = await BusinessProfileModel.update(req.user!.userId, updateData);

    // Invalidate marketing cache since business profile changed
    await CacheService.deletePattern(CacheKeys.marketingPattern(req.user!.userId));

    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          suggestion: 'Please check your input and try again',
          timestamp: new Date(),
        },
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        error: {
          code: 'PROFILE_UPDATE_FAILED',
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
        message: 'An unexpected error occurred while updating profile',
        suggestion: 'Please try again later',
        timestamp: new Date(),
      },
    });
  }
});

export default router;
