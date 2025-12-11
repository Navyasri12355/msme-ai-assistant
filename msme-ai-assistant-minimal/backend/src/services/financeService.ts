import { Transaction, TransactionFilters } from '../types';
import { TransactionModel } from '../models/Transaction';

export interface DateRange {
  startDate: Date;
  endDate: Date;
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

export class FinanceService {
  /**
   * Categorize a transaction as income or expense based on amount
   * Positive amounts are income, negative amounts are expenses
   */
  static categorizeTransaction(transaction: Transaction): 'income' | 'expense' {
    return transaction.amount > 0 ? 'income' : 'expense';
  }

  /**
   * Categorize multiple transactions
   */
  static categorizeTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.map(transaction => ({
      ...transaction,
      type: transaction.type || this.categorizeTransaction(transaction)
    }));
  }

  /**
   * Calculate financial metrics for a given period
   */
  static async calculateMetrics(
    userId: string,
    period: DateRange
  ): Promise<FinancialMetrics> {
    // Fetch transactions for the period
    const transactions = await TransactionModel.findByUser(userId, {
      startDate: period.startDate,
      endDate: period.endDate
    });

    return this.calculateMetricsFromTransactions(transactions, period);
  }

  /**
   * Calculate financial metrics from a list of transactions
   * This method is useful for testing and when transactions are already loaded
   */
  static calculateMetricsFromTransactions(
    transactions: Transaction[],
    period: DateRange
  ): FinancialMetrics {
    // Categorize transactions if not already categorized
    const categorizedTransactions = this.categorizeTransactions(transactions);

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const transaction of categorizedTransactions) {
      const type = transaction.type;
      const amount = Math.abs(transaction.amount);
      const category = transaction.category || 'Uncategorized';

      if (type === 'income') {
        totalIncome += amount;
      } else if (type === 'expense') {
        totalExpenses += amount;
      }

      // Update category breakdown
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + amount,
        count: existing.count + 1
      });
    }

    // Calculate net profit and profit margin
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Convert category map to array
    const categoryBreakdown: CategoryTotal[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => b.total - a.total); // Sort by total descending

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      period,
      categoryBreakdown
    };
  }

  /**
   * Get category breakdown for a specific type (income or expense)
   */
  static async getCategoryBreakdown(
    userId: string,
    type: 'income' | 'expense',
    period: DateRange
  ): Promise<CategoryTotal[]> {
    const transactions = await TransactionModel.findByUser(userId, {
      startDate: period.startDate,
      endDate: period.endDate,
      type
    });

    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const transaction of transactions) {
      const category = transaction.category || 'Uncategorized';
      const amount = Math.abs(transaction.amount);
      
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + amount,
        count: existing.count + 1
      });
    }

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Filter transactions by date range
   */
  static filterTransactionsByDateRange(
    transactions: Transaction[],
    period: DateRange
  ): Transaction[] {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= period.startDate && transactionDate <= period.endDate;
    });
  }

  /**
   * Render financial snapshot as a formatted string
   * This is used for displaying financial data to users
   */
  static renderFinancialSnapshot(metrics: FinancialMetrics): string {
    const lines: string[] = [];
    
    lines.push('Financial Snapshot');
    lines.push('==================');
    lines.push('');
    lines.push(`Income: $${metrics.totalIncome.toFixed(2)}`);
    lines.push(`Expenses: $${metrics.totalExpenses.toFixed(2)}`);
    lines.push(`Net Profit: $${metrics.netProfit.toFixed(2)}`);
    lines.push(`Profit Margin: ${metrics.profitMargin.toFixed(2)}%`);
    lines.push('');
    
    if (metrics.categoryBreakdown.length > 0) {
      lines.push('Category Breakdown:');
      metrics.categoryBreakdown.forEach(cat => {
        lines.push(`  ${cat.category}: $${cat.total.toFixed(2)} (${cat.count} transactions)`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Generate cash flow forecast for the next N months
   * Analyzes historical patterns and seasonal trends
   */
  static async generateForecast(
    userId: string,
    months: number = 3
  ): Promise<CashFlowForecast> {
    // Fetch historical transactions (at least 3 months recommended)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Look back 12 months

    const transactions = await TransactionModel.findByUser(userId, {
      startDate,
      endDate
    });

    return this.generateForecastFromTransactions(transactions, months);
  }

  /**
   * Generate forecast from a list of transactions
   * This method is useful for testing and when transactions are already loaded
   */
  static generateForecastFromTransactions(
    transactions: Transaction[],
    months: number = 3
  ): CashFlowForecast {
    // Check if we have sufficient data
    if (transactions.length === 0) {
      throw new Error('Insufficient data: Need at least some historical transactions for forecasting');
    }

    // Analyze historical patterns
    const monthlyData = this.aggregateTransactionsByMonth(transactions);
    
    // Detect seasonal patterns
    const seasonalFactors = this.detectSeasonalPatterns(monthlyData);
    
    // Calculate baseline averages
    const avgIncome = this.calculateAverage(monthlyData.map(m => m.income));
    const avgExpenses = this.calculateAverage(monthlyData.map(m => m.expenses));
    
    // Generate projections
    const projections: MonthlyProjection[] = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const monthIndex = forecastDate.getMonth();
      const seasonalFactor = seasonalFactors.find(sf => sf.month === monthIndex);
      
      // Apply seasonal adjustment if available
      const projectedIncome = seasonalFactor 
        ? avgIncome * seasonalFactor.incomeFactor
        : avgIncome;
      
      const projectedExpenses = seasonalFactor
        ? avgExpenses * seasonalFactor.expenseFactor
        : avgExpenses;
      
      projections.push({
        month: forecastDate.toISOString().substring(0, 7), // YYYY-MM format
        projectedIncome,
        projectedExpenses,
        projectedNetCashFlow: projectedIncome - projectedExpenses
      });
    }
    
    // Calculate confidence based on data consistency
    const confidence = this.calculateForecastConfidence(monthlyData);
    
    // Generate assumptions
    const assumptions = [
      'Based on historical transaction patterns',
      `Using ${monthlyData.length} months of historical data`,
      'Seasonal patterns incorporated where detected',
      'Assumes similar business conditions continue'
    ];
    
    return {
      projections,
      confidence,
      seasonalFactors,
      assumptions
    };
  }

  /**
   * Aggregate transactions by month
   */
  private static aggregateTransactionsByMonth(
    transactions: Transaction[]
  ): Array<{ month: string; monthIndex: number; income: number; expenses: number }> {
    const monthMap = new Map<string, { income: number; expenses: number }>();
    
    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      
      const existing = monthMap.get(monthKey) || { income: 0, expenses: 0 };
      const amount = Math.abs(transaction.amount);
      
      if (this.categorizeTransaction(transaction) === 'income') {
        existing.income += amount;
      } else {
        existing.expenses += amount;
      }
      
      monthMap.set(monthKey, existing);
    }
    
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        monthIndex: new Date(month + '-01').getMonth(),
        income: data.income,
        expenses: data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Detect seasonal patterns in monthly data
   */
  private static detectSeasonalPatterns(
    monthlyData: Array<{ monthIndex: number; income: number; expenses: number }>
  ): SeasonalFactor[] {
    // Group by month of year
    const monthGroups = new Map<number, { incomes: number[]; expenses: number[] }>();
    
    for (const data of monthlyData) {
      const existing = monthGroups.get(data.monthIndex) || { incomes: [], expenses: [] };
      existing.incomes.push(data.income);
      existing.expenses.push(data.expenses);
      monthGroups.set(data.monthIndex, existing);
    }
    
    // Calculate overall averages
    const allIncomes = monthlyData.map(m => m.income);
    const allExpenses = monthlyData.map(m => m.expenses);
    const avgIncome = this.calculateAverage(allIncomes);
    const avgExpenses = this.calculateAverage(allExpenses);
    
    // Calculate seasonal factors for each month
    const seasonalFactors: SeasonalFactor[] = [];
    
    for (const [monthIndex, data] of monthGroups.entries()) {
      const monthAvgIncome = this.calculateAverage(data.incomes);
      const monthAvgExpenses = this.calculateAverage(data.expenses);
      
      seasonalFactors.push({
        month: monthIndex,
        incomeFactor: avgIncome > 0 ? monthAvgIncome / avgIncome : 1,
        expenseFactor: avgExpenses > 0 ? monthAvgExpenses / avgExpenses : 1
      });
    }
    
    return seasonalFactors;
  }

  /**
   * Calculate average of an array of numbers
   */
  private static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, val) => acc + val, 0);
    return sum / numbers.length;
  }

  /**
   * Calculate forecast confidence based on data consistency
   */
  private static calculateForecastConfidence(
    monthlyData: Array<{ income: number; expenses: number }>
  ): number {
    if (monthlyData.length < 3) return 0.5; // Low confidence with limited data
    if (monthlyData.length < 6) return 0.7; // Medium confidence
    
    // Calculate coefficient of variation for income and expenses
    const incomes = monthlyData.map(m => m.income);
    const expenses = monthlyData.map(m => m.expenses);
    
    const incomeCV = this.calculateCoefficientOfVariation(incomes);
    const expenseCV = this.calculateCoefficientOfVariation(expenses);
    
    // Lower CV means more consistent data, higher confidence
    // CV > 1 means high variability, CV < 0.5 means low variability
    const avgCV = (incomeCV + expenseCV) / 2;
    
    if (avgCV < 0.3) return 0.9; // High confidence
    if (avgCV < 0.6) return 0.8; // Good confidence
    if (avgCV < 1.0) return 0.7; // Medium confidence
    return 0.6; // Lower confidence with high variability
  }

  /**
   * Calculate coefficient of variation (standard deviation / mean)
   */
  private static calculateCoefficientOfVariation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = this.calculateAverage(numbers);
    if (mean === 0) return 0;
    
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const variance = this.calculateAverage(squaredDiffs);
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean;
  }

  /**
   * Adjust forecast based on actual vs projected deviations
   * This method updates future forecasts when actual results deviate significantly
   */
  static adjustForecastBasedOnActuals(
    originalForecast: CashFlowForecast,
    actualIncome: number,
    actualExpenses: number,
    forecastPeriodIndex: number
  ): CashFlowForecast {
    const projection = originalForecast.projections[forecastPeriodIndex];
    
    if (!projection) {
      return originalForecast; // Invalid index, return original
    }
    
    // Handle edge case: if both projected and actual values are near-zero, no meaningful adjustment
    const MEANINGFUL_THRESHOLD = 0.01;
    const projectedTotal = Math.abs(projection.projectedIncome) + Math.abs(projection.projectedExpenses);
    const actualTotal = Math.abs(actualIncome) + Math.abs(actualExpenses);
    
    if (projectedTotal < MEANINGFUL_THRESHOLD && actualTotal < MEANINGFUL_THRESHOLD) {
      return originalForecast; // Both are essentially zero, no adjustment needed
    }
    
    // Calculate deviation percentages
    // For zero baselines, use absolute difference instead of percentage
    let incomeDeviation = 0;
    let expenseDeviation = 0;
    
    if (projection.projectedIncome > MEANINGFUL_THRESHOLD) {
      incomeDeviation = Math.abs(actualIncome - projection.projectedIncome) / projection.projectedIncome;
    } else if (Math.abs(actualIncome) > MEANINGFUL_THRESHOLD) {
      // Projected was zero but actual is non-zero - this is a significant deviation
      incomeDeviation = 1.0; // Treat as 100% deviation
    }
    
    if (projection.projectedExpenses > MEANINGFUL_THRESHOLD) {
      expenseDeviation = Math.abs(actualExpenses - projection.projectedExpenses) / projection.projectedExpenses;
    } else if (Math.abs(actualExpenses) > MEANINGFUL_THRESHOLD) {
      // Projected was zero but actual is non-zero - this is a significant deviation
      expenseDeviation = 1.0; // Treat as 100% deviation
    }
    
    // If deviation is less than 20%, no adjustment needed
    if (incomeDeviation <= 0.2 && expenseDeviation <= 0.2) {
      return originalForecast;
    }
    
    // Calculate adjustment factors
    let incomeAdjustment = 1;
    let expenseAdjustment = 1;
    
    if (projection.projectedIncome > MEANINGFUL_THRESHOLD) {
      incomeAdjustment = actualIncome / projection.projectedIncome;
    } else if (Math.abs(actualIncome) > MEANINGFUL_THRESHOLD) {
      // Projected was zero but actual is non-zero - use actual as new baseline
      incomeAdjustment = actualIncome > 0 ? actualIncome : 1;
    }
    
    if (projection.projectedExpenses > MEANINGFUL_THRESHOLD) {
      expenseAdjustment = actualExpenses / projection.projectedExpenses;
    } else if (Math.abs(actualExpenses) > MEANINGFUL_THRESHOLD) {
      // Projected was zero but actual is non-zero - use actual as new baseline
      expenseAdjustment = actualExpenses > 0 ? actualExpenses : 1;
    }
    
    // Apply adjustments to future projections
    const adjustedProjections = originalForecast.projections.map((proj, index) => {
      if (index <= forecastPeriodIndex) {
        return proj; // Don't adjust past or current period
      }
      
      // Handle zero baseline projections
      let newIncome = proj.projectedIncome;
      let newExpenses = proj.projectedExpenses;
      
      if (proj.projectedIncome > MEANINGFUL_THRESHOLD) {
        newIncome = proj.projectedIncome * incomeAdjustment;
      } else if (typeof incomeAdjustment === 'number' && incomeAdjustment > 1) {
        // If original was zero but we have a new baseline, use it
        newIncome = incomeAdjustment;
      }
      
      if (proj.projectedExpenses > MEANINGFUL_THRESHOLD) {
        newExpenses = proj.projectedExpenses * expenseAdjustment;
      } else if (typeof expenseAdjustment === 'number' && expenseAdjustment > 1) {
        // If original was zero but we have a new baseline, use it
        newExpenses = expenseAdjustment;
      }
      
      return {
        ...proj,
        projectedIncome: newIncome,
        projectedExpenses: newExpenses,
        projectedNetCashFlow: newIncome - newExpenses
      };
    });
    
    return {
      ...originalForecast,
      projections: adjustedProjections,
      assumptions: [
        ...originalForecast.assumptions,
        'Adjusted based on actual results deviating by more than 20%'
      ]
    };
  }
}
