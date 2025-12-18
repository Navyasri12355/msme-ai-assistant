import { TransactionModel } from '../models/Transaction';
import { FinanceService, DateRange } from './financeService';
import { CacheService, CacheKeys, CacheTTL } from '../utils/cache';

export interface KeyMetrics {
  dailyRevenue: number; // Actually represents last 30 days revenue
  totalCustomers: number;
  topProducts: ProductMetric[];
  revenueChange: number;
  customerChange: number;
}

export interface ProductMetric {
  productId: string;
  name: string;
  revenue: number;
  unitsSold: number;
}

export interface MetricTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
}

export interface Alert {
  id: string;
  metric: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  threshold: number;
  currentValue: number;
}

export interface Insight {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendedAction: string;
  expectedImpact: string;
  category: 'finance' | 'marketing' | 'operations';
  likelyCause?: string;
  correctiveMeasures?: string;
  relatedMetric?: string;
  isImprovement?: boolean;
  nextSteps?: string;
}

export interface DashboardData {
  keyMetrics: KeyMetrics;
  trends: MetricTrend[];
  insights: Insight[];
  alerts: Alert[];
  lastUpdated: Date;
}

export interface MetricThreshold {
  metric: string;
  threshold: number;
  comparison: 'above' | 'below';
  severity: 'low' | 'medium' | 'high';
}

export class DashboardService {
  /**
   * Get complete dashboard data for a user
   */
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const cacheKey = CacheKeys.dashboardData(userId);

    return CacheService.getOrSet(
      cacheKey,
      CacheTTL.DASHBOARD_DATA,
      async () => {
        const keyMetrics = await this.calculateKeyMetrics(userId);
        const trends = await this.getMetricTrends(userId, ['revenue', 'customers']);
        const alerts = await this.generateAlerts(userId, keyMetrics);
        const insights = await this.generateInsights(userId);

        return {
          keyMetrics,
          trends,
          insights,
          alerts,
          lastUpdated: new Date()
        };
      }
    );
  }

  /**
   * Calculate key metrics for the dashboard
   */
  static async calculateKeyMetrics(userId: string): Promise<KeyMetrics> {
    const cacheKey = CacheKeys.dashboardMetrics(userId);

    return CacheService.getOrSet(
      cacheKey,
      CacheTTL.DASHBOARD_DATA,
      async () => this.calculateKeyMetricsInternal(userId)
    );
  }

  /**
   * Internal method to calculate key metrics (without caching)
   */
  private static async calculateKeyMetricsInternal(userId: string): Promise<KeyMetrics> {
    // Get current period (last 30 days) for more meaningful metrics
    const currentEnd = new Date();
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 30);

    const currentRange: DateRange = {
      startDate: currentStart,
      endDate: currentEnd
    };

    // Get previous period (30 days before current period) for comparison
    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 30);

    const previousRange: DateRange = {
      startDate: previousStart,
      endDate: previousEnd
    };

    // Calculate current period revenue
    const currentTransactions = await TransactionModel.findByUser(userId, {
      startDate: currentRange.startDate,
      endDate: currentRange.endDate
    });

    const currentMetrics = FinanceService.calculateMetricsFromTransactions(
      currentTransactions,
      currentRange
    );

    // Calculate previous period revenue for comparison
    const previousTransactions = await TransactionModel.findByUser(userId, {
      startDate: previousRange.startDate,
      endDate: previousRange.endDate
    });

    const previousMetrics = FinanceService.calculateMetricsFromTransactions(
      previousTransactions,
      previousRange
    );

    // Calculate customer count (unique customer IDs)
    const currentCustomers = new Set(
      currentTransactions
        .filter(t => t.customerId)
        .map(t => t.customerId)
    ).size;

    const previousCustomers = new Set(
      previousTransactions
        .filter(t => t.customerId)
        .map(t => t.customerId)
    ).size;

    // Calculate top products from current period
    const topProducts = this.calculateTopProducts(currentTransactions);

    // Calculate changes
    const revenueChange = previousMetrics.totalIncome > 0
      ? ((currentMetrics.totalIncome - previousMetrics.totalIncome) / previousMetrics.totalIncome) * 100
      : 0;

    const customerChange = previousCustomers > 0
      ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
      : 0;

    return {
      dailyRevenue: currentMetrics.totalIncome, // Now represents last 30 days revenue
      totalCustomers: currentCustomers,
      topProducts,
      revenueChange,
      customerChange
    };
  }

  /**
   * Calculate top products from transactions
   */
  private static calculateTopProducts(transactions: any[]): ProductMetric[] {
    const productMap = new Map<string, { revenue: number; unitsSold: number }>();

    for (const transaction of transactions) {
      if (transaction.productId && transaction.type === 'income') {
        const existing = productMap.get(transaction.productId) || {
          revenue: 0,
          unitsSold: 0
        };

        productMap.set(transaction.productId, {
          revenue: existing.revenue + Math.abs(transaction.amount),
          unitsSold: existing.unitsSold + 1
        });
      }
    }

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        name: `Product ${productId.substring(0, 8)}`, // Simplified name
        revenue: data.revenue,
        unitsSold: data.unitsSold
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 products
  }

  /**
   * Get metric trends comparing current and previous periods
   */
  static async getMetricTrends(
    userId: string,
    metrics: string[]
  ): Promise<MetricTrend[]> {
    const cacheKey = CacheKeys.dashboardTrends(userId, metrics);

    return CacheService.getOrSet(
      cacheKey,
      CacheTTL.DASHBOARD_DATA,
      async () => this.getMetricTrendsInternal(userId, metrics)
    );
  }

  /**
   * Internal method to get metric trends (without caching)
   */
  private static async getMetricTrendsInternal(
    userId: string,
    metrics: string[]
  ): Promise<MetricTrend[]> {
    const trends: MetricTrend[] = [];

    // Define current and previous periods (last 7 days vs previous 7 days)
    const currentEnd = new Date();
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 7);

    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 7);

    const currentRange: DateRange = {
      startDate: currentStart,
      endDate: currentEnd
    };

    const previousRange: DateRange = {
      startDate: previousStart,
      endDate: previousEnd
    };

    // Get transactions for both periods
    const currentTransactions = await TransactionModel.findByUser(userId, {
      startDate: currentRange.startDate,
      endDate: currentRange.endDate
    });

    const previousTransactions = await TransactionModel.findByUser(userId, {
      startDate: previousRange.startDate,
      endDate: previousRange.endDate
    });

    // Calculate metrics for both periods
    const currentMetrics = FinanceService.calculateMetricsFromTransactions(
      currentTransactions,
      currentRange
    );

    const previousMetrics = FinanceService.calculateMetricsFromTransactions(
      previousTransactions,
      previousRange
    );

    // Build trends for requested metrics
    for (const metric of metrics) {
      if (metric === 'revenue') {
        const current = currentMetrics.totalIncome;
        const previous = previousMetrics.totalIncome;
        const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

        trends.push({
          metric: 'revenue',
          current,
          previous,
          change,
          direction: this.calculateDirection(current, previous)
        });
      } else if (metric === 'customers') {
        const currentCustomers = new Set(
          currentTransactions
            .filter(t => t.customerId)
            .map(t => t.customerId)
        ).size;

        const previousCustomers = new Set(
          previousTransactions
            .filter(t => t.customerId)
            .map(t => t.customerId)
        ).size;

        const change = previousCustomers > 0
          ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
          : 0;

        trends.push({
          metric: 'customers',
          current: currentCustomers,
          previous: previousCustomers,
          change,
          direction: this.calculateDirection(currentCustomers, previousCustomers)
        });
      }
    }

    return trends;
  }

  /**
   * Calculate trend direction based on current and previous values
   */
  static calculateDirection(current: number, previous: number): 'up' | 'down' | 'stable' {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  /**
   * Generate alerts based on metric thresholds
   */
  static async generateAlerts(
    userId: string,
    keyMetrics: KeyMetrics
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Define default thresholds
    const thresholds: MetricThreshold[] = [
      {
        metric: 'dailyRevenue',
        threshold: 1000,
        comparison: 'below',
        severity: 'medium'
      },
      {
        metric: 'revenueChange',
        threshold: -10,
        comparison: 'below',
        severity: 'high'
      },
      {
        metric: 'customerChange',
        threshold: -15,
        comparison: 'below',
        severity: 'medium'
      }
    ];

    // Check each threshold
    for (const threshold of thresholds) {
      const value = this.getMetricValue(keyMetrics, threshold.metric);
      
      if (this.shouldGenerateAlert(value, threshold)) {
        alerts.push({
          id: `alert-${threshold.metric}-${Date.now()}`,
          metric: threshold.metric,
          message: this.generateAlertMessage(threshold.metric, value, threshold),
          severity: threshold.severity,
          threshold: threshold.threshold,
          currentValue: value
        });
      }
    }

    return alerts;
  }

  /**
   * Get metric value from KeyMetrics object
   */
  private static getMetricValue(keyMetrics: KeyMetrics, metric: string): number {
    switch (metric) {
      case 'dailyRevenue':
        return keyMetrics.dailyRevenue;
      case 'revenueChange':
        return keyMetrics.revenueChange;
      case 'customerChange':
        return keyMetrics.customerChange;
      case 'totalCustomers':
        return keyMetrics.totalCustomers;
      default:
        return 0;
    }
  }

  /**
   * Check if an alert should be generated based on threshold
   */
  private static shouldGenerateAlert(
    value: number,
    threshold: MetricThreshold
  ): boolean {
    if (threshold.comparison === 'below') {
      return value < threshold.threshold;
    } else {
      return value > threshold.threshold;
    }
  }

  /**
   * Generate alert message
   */
  private static generateAlertMessage(
    metric: string,
    value: number,
    threshold: MetricThreshold
  ): string {
    const formattedValue = metric.includes('Change')
      ? `${value.toFixed(1)}%`
      : value.toFixed(2);

    const formattedThreshold = metric.includes('Change')
      ? `${threshold.threshold}%`
      : threshold.threshold.toString();

    return `${metric} is ${formattedValue}, which is ${threshold.comparison} the threshold of ${formattedThreshold}`;
  }

  /**
   * Generate actionable insights from business data
   */
  static async generateInsights(userId: string): Promise<Insight[]> {
    const cacheKey = CacheKeys.dashboardInsights(userId);

    return CacheService.getOrSet(
      cacheKey,
      CacheTTL.DASHBOARD_DATA,
      async () => this.generateInsightsInternal(userId)
    );
  }

  /**
   * Internal method to generate insights (without caching)
   */
  private static async generateInsightsInternal(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get recent data for analysis (current period: last 30 days)
    const currentEnd = new Date();
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 30);

    // Get previous period data (previous 30 days before current period)
    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 30);

    const currentTransactions = await TransactionModel.findByUser(userId, {
      startDate: currentStart,
      endDate: currentEnd
    });

    const previousTransactions = await TransactionModel.findByUser(userId, {
      startDate: previousStart,
      endDate: previousEnd
    });

    const currentMetrics = FinanceService.calculateMetricsFromTransactions(
      currentTransactions,
      { startDate: currentStart, endDate: currentEnd }
    );

    const previousMetrics = FinanceService.calculateMetricsFromTransactions(
      previousTransactions,
      { startDate: previousStart, endDate: previousEnd }
    );

    // Analyze declining metrics and generate insights
    const decliningInsights = this.analyzeMetricChanges(
      currentMetrics,
      previousMetrics,
      currentTransactions,
      previousTransactions
    );
    insights.push(...decliningInsights);

    // Analyze improving metrics and generate acknowledgment insights
    const improvementInsights = this.analyzeImprovements(
      currentMetrics,
      previousMetrics
    );
    insights.push(...improvementInsights);

    // Generate general performance insights
    const performanceInsights = this.generatePerformanceInsights(
      currentMetrics,
      currentTransactions
    );
    insights.push(...performanceInsights);

    // Prioritize insights by impact
    return this.prioritizeInsights(insights);
  }

  /**
   * Analyze metric changes and identify declining metrics with causes
   */
  private static analyzeMetricChanges(
    currentMetrics: any,
    previousMetrics: any,
    currentTransactions: any[],
    previousTransactions: any[]
  ): Insight[] {
    const insights: Insight[] = [];

    // Check revenue decline
    if (previousMetrics.totalIncome > 0) {
      const revenueChange = ((currentMetrics.totalIncome - previousMetrics.totalIncome) / previousMetrics.totalIncome) * 100;
      
      if (revenueChange < -10) {
        // Identify likely cause
        const currentCustomers = new Set(currentTransactions.filter(t => t.customerId).map(t => t.customerId)).size;
        const previousCustomers = new Set(previousTransactions.filter(t => t.customerId).map(t => t.customerId)).size;
        const customerChange = previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0;

        let likelyCause = '';
        let correctiveMeasures = '';

        if (customerChange < -10) {
          likelyCause = 'Customer count has decreased significantly, indicating customer retention issues';
          correctiveMeasures = 'Implement customer retention programs, reach out to inactive customers, and improve customer service';
        } else {
          likelyCause = 'Average transaction value has decreased, suggesting pricing or product mix issues';
          correctiveMeasures = 'Review pricing strategy, promote higher-value products, and consider upselling opportunities';
        }

        insights.push({
          id: `insight-revenue-decline-${Date.now()}`,
          priority: 'high',
          title: 'Revenue Decline Detected',
          description: `Revenue has decreased by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period.`,
          recommendedAction: 'Immediate action required to reverse the declining trend',
          expectedImpact: `Reversing this trend could recover ₹${(previousMetrics.totalIncome - currentMetrics.totalIncome).toFixed(2)}`,
          category: 'finance',
          likelyCause,
          correctiveMeasures,
          relatedMetric: 'revenue'
        });
      }
    }

    // Check profit margin decline
    if (previousMetrics.profitMargin > 0) {
      const marginChange = currentMetrics.profitMargin - previousMetrics.profitMargin;
      
      if (marginChange < -5) {
        const expenseChange = previousMetrics.totalExpenses > 0 
          ? ((currentMetrics.totalExpenses - previousMetrics.totalExpenses) / previousMetrics.totalExpenses) * 100 
          : 0;

        let likelyCause = '';
        let correctiveMeasures = '';

        if (expenseChange > 10) {
          likelyCause = 'Operating expenses have increased significantly, reducing profitability';
          correctiveMeasures = 'Conduct expense audit, negotiate with suppliers, and eliminate unnecessary costs';
        } else {
          likelyCause = 'Revenue growth is not keeping pace with expense growth';
          correctiveMeasures = 'Focus on revenue-generating activities and optimize pricing strategy';
        }

        insights.push({
          id: `insight-margin-decline-${Date.now()}`,
          priority: 'high',
          title: 'Profit Margin Declining',
          description: `Profit margin has decreased by ${Math.abs(marginChange).toFixed(1)} percentage points.`,
          recommendedAction: 'Review cost structure and pricing to improve profitability',
          expectedImpact: `Restoring previous margin could increase profit by ₹${(currentMetrics.totalIncome * Math.abs(marginChange) / 100).toFixed(2)}`,
          category: 'finance',
          likelyCause,
          correctiveMeasures,
          relatedMetric: 'profitMargin'
        });
      }
    }

    return insights;
  }

  /**
   * Analyze improvements and generate acknowledgment insights
   */
  private static analyzeImprovements(
    currentMetrics: any,
    previousMetrics: any
  ): Insight[] {
    const insights: Insight[] = [];

    // Check revenue improvement
    if (previousMetrics.totalIncome > 0) {
      const revenueChange = ((currentMetrics.totalIncome - previousMetrics.totalIncome) / previousMetrics.totalIncome) * 100;
      
      if (revenueChange > 15) {
        insights.push({
          id: `insight-revenue-improvement-${Date.now()}`,
          priority: 'medium',
          title: 'Strong Revenue Growth',
          description: `Revenue has increased by ${revenueChange.toFixed(1)}% compared to the previous period.`,
          recommendedAction: 'Continue current strategies and consider scaling successful initiatives',
          expectedImpact: 'Maintaining this growth rate could double revenue in 6 months',
          category: 'finance',
          isImprovement: true,
          nextSteps: 'Analyze what drove this growth and replicate those strategies. Consider investing in marketing to accelerate growth.',
          relatedMetric: 'revenue'
        });
      }
    }

    // Check profit margin improvement
    if (previousMetrics.profitMargin > 0) {
      const marginChange = currentMetrics.profitMargin - previousMetrics.profitMargin;
      
      if (marginChange > 5) {
        insights.push({
          id: `insight-margin-improvement-${Date.now()}`,
          priority: 'medium',
          title: 'Profit Margin Improving',
          description: `Profit margin has increased by ${marginChange.toFixed(1)} percentage points.`,
          recommendedAction: 'Document and maintain the practices that led to this improvement',
          expectedImpact: 'Sustaining this margin improvement will significantly boost profitability',
          category: 'finance',
          isImprovement: true,
          nextSteps: 'Review recent cost-cutting or pricing changes and make them permanent. Share best practices across the business.',
          relatedMetric: 'profitMargin'
        });
      }
    }

    return insights;
  }

  /**
   * Generate general performance insights
   */
  private static generatePerformanceInsights(
    metrics: any,
    transactions: any[]
  ): Insight[] {
    const insights: Insight[] = [];

    // Low profit margin insight
    if (metrics.profitMargin < 20 && metrics.profitMargin > 0) {
      insights.push({
        id: `insight-profit-${Date.now()}`,
        priority: 'medium',
        title: 'Low Profit Margin Detected',
        description: `Your profit margin is ${metrics.profitMargin.toFixed(1)}%, which is below the healthy threshold of 20%.`,
        recommendedAction: 'Review your pricing strategy and identify areas to reduce costs',
        expectedImpact: `Improving profit margin by 5% could increase monthly profit by ₹${(metrics.totalIncome * 0.05).toFixed(2)}`,
        category: 'finance'
      });
    }

    // High expense concentration insight
    const topExpenseCategory = metrics.categoryBreakdown
      .filter((cat: any) => cat.category !== 'Uncategorized')
      .sort((a: any, b: any) => b.total - a.total)[0];

    if (topExpenseCategory && topExpenseCategory.total > metrics.totalExpenses * 0.4) {
      insights.push({
        id: `insight-expense-${Date.now()}`,
        priority: 'low',
        title: 'High Spending in One Category',
        description: `${topExpenseCategory.category} accounts for ${((topExpenseCategory.total / metrics.totalExpenses) * 100).toFixed(1)}% of your expenses.`,
        recommendedAction: `Review ${topExpenseCategory.category} expenses and look for cost-saving opportunities`,
        expectedImpact: `Reducing this category by 10% could save ₹${(topExpenseCategory.total * 0.1).toFixed(2)}`,
        category: 'operations'
      });
    }

    // Revenue growth opportunity
    if (metrics.totalIncome > 0) {
      insights.push({
        id: `insight-growth-${Date.now()}`,
        priority: 'low',
        title: 'Revenue Growth Opportunity',
        description: 'Your business is generating consistent revenue. Consider expanding your marketing efforts.',
        recommendedAction: 'Invest 5-10% of revenue in targeted marketing campaigns',
        expectedImpact: 'Could increase customer base by 15-20% in the next quarter',
        category: 'marketing'
      });
    }

    return insights;
  }

  /**
   * Prioritize insights by impact and urgency
   */
  private static prioritizeInsights(insights: Insight[]): Insight[] {
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    return insights.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Refresh all dashboard metrics
   */
  static async refreshMetrics(userId: string): Promise<void> {
    // Invalidate all dashboard caches for this user
    await CacheService.deletePattern(CacheKeys.dashboardPattern(userId));
    
    // Fetch fresh data (which will be cached)
    await this.getDashboardData(userId);
  }
}
