import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  period: DateRange;
  categoryBreakdown: CategoryTotal[];
}

export interface MonthlyProjection {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
}

export interface SeasonalFactor {
  month: number;
  incomeFactor: number;
  expenseFactor: number;
}

export interface CashFlowForecast {
  projections: MonthlyProjection[];
  confidence: number;
  seasonalFactors: SeasonalFactor[];
  assumptions: string[];
}

export const financeApi = {
  // Get financial metrics for a date range
  getMetrics: async (startDate: string, endDate: string): Promise<FinancialMetrics> => {
    const response = await apiClient.get<ApiResponse<FinancialMetrics>>('/finance/metrics', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  // Get cash flow forecast
  getForecast: async (months: number = 3): Promise<CashFlowForecast> => {
    const response = await apiClient.get<ApiResponse<CashFlowForecast>>('/finance/forecast', {
      params: { months },
    });
    return response.data.data;
  },

  // Get category breakdown for income or expenses
  getCategoryBreakdown: async (
    type: 'income' | 'expense',
    startDate: string,
    endDate: string
  ): Promise<CategoryTotal[]> => {
    const response = await apiClient.get<ApiResponse<{ categories: CategoryTotal[] }>>(
      '/finance/categories',
      {
        params: { type, startDate, endDate },
      }
    );
    return response.data.data.categories;
  },
};
