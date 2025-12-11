import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface KeyMetrics {
  dailyRevenue: number;
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

export const dashboardApi = {
  /**
   * Get complete dashboard data
   */
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data.data;
  },

  /**
   * Get key metrics only
   */
  getKeyMetrics: async (): Promise<KeyMetrics> => {
    const response = await apiClient.get<ApiResponse<KeyMetrics>>('/dashboard/metrics');
    return response.data.data;
  },

  /**
   * Get metric trends
   */
  getMetricTrends: async (metrics: string[]): Promise<MetricTrend[]> => {
    const response = await apiClient.get<ApiResponse<MetricTrend[]>>(
      `/dashboard/trends?metrics=${metrics.join(',')}`
    );
    return response.data.data;
  },

  /**
   * Get actionable insights
   */
  getInsights: async (): Promise<Insight[]> => {
    const response = await apiClient.get<ApiResponse<Insight[]>>('/dashboard/insights');
    return response.data.data;
  },

  /**
   * Refresh dashboard metrics
   */
  refreshMetrics: async (): Promise<void> => {
    await apiClient.post<ApiResponse<{ message: string }>>('/dashboard/refresh');
  }
};
