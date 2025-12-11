import { Router, Request, Response } from 'express';
import { FinanceService } from '../services/financeService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/finance/metrics
 * Get financial metrics for a date range
 */
router.get('/metrics', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'startDate and endDate are required',
          timestamp: new Date()
        }
      });
    }

    const period = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const metrics = await FinanceService.calculateMetrics(userId, period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    console.error('Error fetching financial metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to fetch financial metrics',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

/**
 * GET /api/finance/forecast
 * Get cash flow forecast
 */
router.get('/forecast', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const months = parseInt(req.query.months as string) || 3;

    const forecast = await FinanceService.generateForecast(userId, months);

    res.json({
      success: true,
      data: forecast
    });
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FORECAST_ERROR',
        message: 'Failed to generate cash flow forecast',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

/**
 * GET /api/finance/categories
 * Get category breakdown for income or expenses
 */
router.get('/categories', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, startDate, endDate } = req.query;

    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'type, startDate, and endDate are required',
          timestamp: new Date()
        }
      });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'type must be either "income" or "expense"',
          timestamp: new Date()
        }
      });
    }

    const period = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const categories = await FinanceService.getCategoryBreakdown(
      userId,
      type as 'income' | 'expense',
      period
    );

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error: any) {
    console.error('Error fetching category breakdown:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CATEGORY_ERROR',
        message: 'Failed to fetch category breakdown',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

export default router;
