import React, { useState, useEffect } from 'react';
import { financeApi, FinancialMetrics, CashFlowForecast, CategoryTotal } from '../api/finance';
import { Navigation } from '../components/Navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export const FinanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Data state
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [incomeCategories, setIncomeCategories] = useState<CategoryTotal[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryTotal[]>([]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all finance data in parallel
      const [metricsData, forecastData, incomeData, expenseData] = await Promise.all([
        financeApi.getMetrics(startDate, endDate),
        financeApi.getForecast(3),
        financeApi.getCategoryBreakdown('income', startDate, endDate),
        financeApi.getCategoryBreakdown('expense', startDate, endDate),
      ]);

      setMetrics(metricsData);
      setForecast(forecastData);
      setIncomeCategories(incomeData);
      setExpenseCategories(expenseData);
    } catch (err: any) {
      console.error('Error fetching finance data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [startDate, endDate]);

  const handleDateRangeChange = () => {
    fetchFinanceData();
  };

  // Prepare data for income vs expenses chart
  const incomeVsExpensesData = metrics
    ? [
        { name: 'Income', value: metrics.totalIncome, fill: '#10B981' },
        { name: 'Expenses', value: metrics.totalExpenses, fill: '#EF4444' },
      ]
    : [];

  // Prepare data for forecast chart
  const forecastChartData = forecast
    ? forecast.projections.map((proj) => ({
        month: proj.month,
        Income: proj.projectedIncome,
        Expenses: proj.projectedExpenses,
        'Net Cash Flow': proj.projectedNetCashFlow,
      }))
    : [];

  // Prepare data for category breakdown pie charts
  const incomePieData = incomeCategories.map((cat, index) => ({
    name: cat.category,
    value: cat.total,
    fill: COLORS[index % COLORS.length],
  }));

  const expensePieData = expenseCategories.map((cat, index) => ({
    name: cat.category,
    value: cat.total,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Finance Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
              View your financial metrics, forecasts, and category breakdowns
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleDateRangeChange}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading finance data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Financial Metrics */}
          {!loading && !error && metrics && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Income</h3>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{metrics.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Expenses</h3>
                  <p className="text-3xl font-bold text-red-600">
                    ₹{metrics.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Net Profit</h3>
                  <p
                    className={`text-3xl font-bold ${
                      metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ₹{metrics.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Profit Margin</h3>
                  <p
                    className={`text-3xl font-bold ${
                      metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metrics.profitMargin.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Income vs Expenses Chart */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeVsExpensesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Income Categories */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
                  {incomePieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={incomePieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {incomePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {incomeCategories.map((cat, index) => (
                          <div key={cat.category} className="flex justify-between text-sm">
                            <span className="flex items-center">
                              <span
                                className="inline-block w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></span>
                              {cat.category}
                            </span>
                            <span className="font-medium">
                              ₹{cat.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No income data available</p>
                  )}
                </div>

                {/* Expense Categories */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                  {expensePieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expensePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {expenseCategories.map((cat, index) => (
                          <div key={cat.category} className="flex justify-between text-sm">
                            <span className="flex items-center">
                              <span
                                className="inline-block w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></span>
                              {cat.category}
                            </span>
                            <span className="font-medium">
                              ₹{cat.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No expense data available</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Cash Flow Forecast */}
          {!loading && !error && forecast && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cash Flow Forecast (Next 3 Months)
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Confidence: <span className="font-medium">{(forecast.confidence * 100).toFixed(0)}%</span>
                </p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Net Cash Flow" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Assumptions:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {forecast.assumptions.map((assumption, index) => (
                    <li key={index}>{assumption}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
