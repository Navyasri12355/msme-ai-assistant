import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, DashboardData } from '../api/dashboard';
import { Navigation } from '../components/Navigation';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await dashboardApi.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await dashboardApi.refreshMetrics();
      await loadDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to refresh dashboard');
      console.error('Error refreshing dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') return '↑';
    if (direction === 'down') return '↓';
    return '→';
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable', isPositive: boolean = true) => {
    if (direction === 'stable') return 'text-gray-500';
    if (direction === 'up') return isPositive ? 'text-green-600' : 'text-red-600';
    return isPositive ? 'text-red-600' : 'text-green-600';
  };

  const getAlertColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getCategoryIcon = (category: 'finance' | 'marketing' | 'operations') => {
    switch (category) {
      case 'finance': return '💰';
      case 'marketing': return '📢';
      case 'operations': return '⚙️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with Refresh Button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Business Dashboard</h2>
              {dashboardData && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* Dashboard Content */}
          {!loading && dashboardData && (
            <div className="space-y-6">
              {/* Alerts Section */}
              {dashboardData.alerts && dashboardData.alerts.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Alerts & Notifications</h3>
                  <div className="space-y-3">
                    {dashboardData.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${getAlertColor(alert.severity)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{alert.metric}</h4>
                            <p className="text-sm mt-1">{alert.message}</p>
                            <p className="text-xs mt-2">
                              Current: {alert.currentValue} | Threshold: {alert.threshold}
                            </p>
                          </div>
                          <span className="text-xs font-semibold uppercase">{alert.severity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Daily Revenue Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        ₹{dashboardData.keyMetrics.dailyRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-4xl">💰</div>
                  </div>
                  {dashboardData.keyMetrics.revenueChange !== undefined && (
                    <div className="mt-4 flex items-center">
                      <span className={`text-sm font-semibold ${dashboardData.keyMetrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dashboardData.keyMetrics.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.keyMetrics.revenueChange).toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-500 ml-2">vs previous period</span>
                    </div>
                  )}
                </div>

                {/* Total Customers Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Customers</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {dashboardData.keyMetrics.totalCustomers.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                  {dashboardData.keyMetrics.customerChange !== undefined && (
                    <div className="mt-4 flex items-center">
                      <span className={`text-sm font-semibold ${dashboardData.keyMetrics.customerChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dashboardData.keyMetrics.customerChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.keyMetrics.customerChange).toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-500 ml-2">vs previous period</span>
                    </div>
                  )}
                </div>

                {/* Top Products Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-600">Top Products</p>
                    <div className="text-4xl">🏆</div>
                  </div>
                  {dashboardData.keyMetrics.topProducts && dashboardData.keyMetrics.topProducts.length > 0 ? (
                    <div className="space-y-2">
                      {dashboardData.keyMetrics.topProducts.slice(0, 3).map((product, index) => (
                        <div key={product.productId} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="text-sm font-semibold text-gray-500 mr-2">{index + 1}.</span>
                            <span className="text-sm text-gray-900">{product.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{product.revenue.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No product data available</p>
                  )}
                </div>
              </div>

              {/* Metric Trends */}
              {dashboardData.trends && dashboardData.trends.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Metric Trends</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.trends.map((trend) => (
                      <div key={trend.metric} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">{trend.metric}</p>
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-bold text-gray-900">{trend.current.toLocaleString()}</p>
                          <span className={`text-lg font-bold ${getTrendColor(trend.direction)}`}>
                            {getTrendIcon(trend.direction)} {Math.abs(trend.change).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Previous: {trend.previous.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights Panel */}
              {dashboardData.insights && dashboardData.insights.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Actionable Insights</h3>
                  <div className="space-y-4">
                    {dashboardData.insights
                      .sort((a, b) => {
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                      })
                      .map((insight) => (
                        <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{getCategoryIcon(insight.category)}</span>
                              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                            </div>
                            {getPriorityBadge(insight.priority)}
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                          
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-2">
                            <p className="text-sm font-medium text-blue-900">Recommended Action:</p>
                            <p className="text-sm text-blue-800 mt-1">{insight.recommendedAction}</p>
                          </div>
                          
                          <div className="bg-green-50 border-l-4 border-green-400 p-3">
                            <p className="text-sm font-medium text-green-900">Expected Impact:</p>
                            <p className="text-sm text-green-800 mt-1">{insight.expectedImpact}</p>
                          </div>

                          {insight.likelyCause && (
                            <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                              <p className="text-sm font-medium text-yellow-900">Likely Cause:</p>
                              <p className="text-sm text-yellow-800 mt-1">{insight.likelyCause}</p>
                            </div>
                          )}

                          {insight.correctiveMeasures && (
                            <div className="mt-2 bg-orange-50 border-l-4 border-orange-400 p-3">
                              <p className="text-sm font-medium text-orange-900">Corrective Measures:</p>
                              <p className="text-sm text-orange-800 mt-1">{insight.correctiveMeasures}</p>
                            </div>
                          )}

                          {insight.isImprovement && insight.nextSteps && (
                            <div className="mt-2 bg-purple-50 border-l-4 border-purple-400 p-3">
                              <p className="text-sm font-medium text-purple-900">🎉 Great Progress! Next Steps:</p>
                              <p className="text-sm text-purple-800 mt-1">{insight.nextSteps}</p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                            <span className="capitalize">{insight.category} insight</span>
                            {insight.relatedMetric && <span>Related to: {insight.relatedMetric}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!dashboardData.keyMetrics.dailyRevenue && 
               !dashboardData.keyMetrics.totalCustomers && 
               dashboardData.insights.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-600 mb-4">
                    Start by adding transactions and setting up your business profile to see insights.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => navigate('/transactions')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Transactions
                    </button>
                    <button
                      onClick={() => navigate('/profile')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Update Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
