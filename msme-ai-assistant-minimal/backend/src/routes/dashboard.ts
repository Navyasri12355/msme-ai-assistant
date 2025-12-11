import { Router, Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/dashboard
 * Get complete dashboard data for the authenticated user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const dashboardData = await DashboardService.getDashboardData(userId);

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_ERROR',
        message: 'Failed to fetch dashboard data',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

/**
 * GET /api/dashboard/metrics
 * Get key metrics only
 */
router.get('/metrics', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const keyMetrics = await DashboardService.calculateKeyMetrics(userId);

    res.json({
      success: true,
      data: keyMetrics
    });
  } catch (error: any) {
    console.error('Error fetching key metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to fetch key metrics',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

/**
 * GET /api/dashboard/trends
 * Get metric trends
 */
router.get('/trends', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const metrics = (req.query.metrics as string)?.split(',') || ['revenue', 'customers'];
    const trends = await DashboardService.getMetricTrends(userId, metrics);

    res.json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRENDS_ERROR',
        message: 'Failed to fetch metric trends',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

/**
 * GET /api/dashboard/insights
 * Get actionable insights
 */
router.get('/insights', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const insights = await DashboardService.generateInsights(userId);

    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INSIGHTS_ERROR',
        message: 'Failed to fetch insights',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

/**
 * POST /api/dashboard/refresh
 * Refresh dashboard metrics
 */
router.post('/refresh', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    await DashboardService.refreshMetrics(userId);

    res.json({
      success: true,
      data: {
        message: 'Dashboard metrics refreshed successfully'
      }
    });
  } catch (error: any) {
    console.error('Error refreshing metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh metrics',
        details: error.message,
        timestamp: new Date()
      }
    });
  }
});

export default router;
