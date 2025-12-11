# API Usage Guide - MSME AI Assistant

## Introduction

This guide provides practical examples and best practices for integrating with the MSME AI Assistant API. Whether you're building a web application, mobile app, or backend integration, this guide will help you get started quickly.

## Quick Start

### Prerequisites

- Node.js 16+ (for JavaScript/TypeScript examples)
- Valid API credentials (email and password)
- Base URL: `http://localhost:3000/api` (development) or your production URL

### Installation

For JavaScript/TypeScript projects:

```bash
npm install axios
# or
yarn add axios
```

### Basic Setup

Create an API client:

```typescript
// api-client.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', data.data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Common Use Cases

### 1. User Authentication

#### Register and Login

```typescript
// auth.service.ts
import { apiClient } from './api-client';

export const authService = {
  async register(email: string, password: string) {
    const { data } = await apiClient.post('/auth/register', {
      email,
      password,
    });
    
    // Store tokens
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    
    return data.data.user;
  },

  async login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
    });
    
    // Store tokens
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    
    return data.data.user;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
```

#### Usage in React Component

```typescript
// LoginForm.tsx
import React, { useState } from 'react';
import { authService } from './auth.service';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login(email, password);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
};
```

---

### 2. Business Profile Management

```typescript
// profile.service.ts
import { apiClient } from './api-client';

export interface BusinessProfile {
  businessName: string;
  businessType: string;
  industry: string;
  location: string;
  targetAudience: string;
  monthlyRevenue?: number;
  employeeCount: number;
  establishedDate: string;
}

export const profileService = {
  async createProfile(profile: BusinessProfile) {
    const { data } = await apiClient.post('/profile', profile);
    return data.data.profile;
  },

  async getProfile() {
    const { data } = await apiClient.get('/profile');
    return data.data.profile;
  },

  async updateProfile(updates: Partial<BusinessProfile>) {
    const { data } = await apiClient.put('/profile', updates);
    return data.data.profile;
  },
};
```

---

### 3. Transaction Management

#### Single Transaction

```typescript
// transaction.service.ts
import { apiClient } from './api-client';

export interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date?: string;
  paymentMethod?: string;
  customerId?: string;
  productId?: string;
  metadata?: Record<string, any>;
}

export const transactionService = {
  async createTransaction(transaction: Transaction) {
    const { data } = await apiClient.post('/transactions', transaction);
    return data.data;
  },

  async getTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: 'income' | 'expense';
  }) {
    const { data } = await apiClient.get('/transactions', { params: filters });
    return data.data.transactions;
  },

  async deleteTransaction(id: string) {
    const { data } = await apiClient.delete(`/transactions/${id}`);
    return data.data;
  },
};
```

#### Batch Upload

```typescript
// Batch upload from CSV
export const uploadTransactionsFromCSV = async (file: File) => {
  const text = await file.text();
  const lines = text.split('\n').slice(1); // Skip header
  
  const transactions = lines
    .filter(line => line.trim())
    .map(line => {
      const [date, amount, type, category, description] = line.split(',');
      return {
        date: date.trim(),
        amount: parseFloat(amount.trim()),
        type: type.trim() as 'income' | 'expense',
        category: category.trim(),
        description: description.trim(),
      };
    });

  const { data } = await apiClient.post('/transactions/batch', {
    transactions,
  });
  
  return data.data;
};
```

---

### 4. Financial Analysis

```typescript
// finance.service.ts
import { apiClient } from './api-client';

export const financeService = {
  async getMetrics(startDate: string, endDate: string) {
    const { data } = await apiClient.get('/finance/metrics', {
      params: { startDate, endDate },
    });
    return data.data;
  },

  async getForecast(months: number = 3) {
    const { data } = await apiClient.get('/finance/forecast', {
      params: { months },
    });
    return data.data;
  },

  async getCategoryBreakdown(
    type: 'income' | 'expense',
    startDate: string,
    endDate: string
  ) {
    const { data } = await apiClient.get('/finance/categories', {
      params: { type, startDate, endDate },
    });
    return data.data.categories;
  },
};
```

#### Usage Example: Monthly Report

```typescript
// MonthlyReport.tsx
import React, { useEffect, useState } from 'react';
import { financeService } from './finance.service';

export const MonthlyReport: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString();

      try {
        const data = await financeService.getMetrics(startDate, endDate);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="monthly-report">
      <h2>Monthly Financial Report</h2>
      <div className="metrics">
        <div className="metric">
          <label>Total Income</label>
          <span>₹{metrics.totalIncome.toLocaleString()}</span>
        </div>
        <div className="metric">
          <label>Total Expenses</label>
          <span>₹{metrics.totalExpenses.toLocaleString()}</span>
        </div>
        <div className="metric">
          <label>Net Profit</label>
          <span>₹{metrics.netProfit.toLocaleString()}</span>
        </div>
        <div className="metric">
          <label>Profit Margin</label>
          <span>{metrics.profitMargin.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};
```

---

### 5. Marketing Features

```typescript
// marketing.service.ts
import { apiClient } from './api-client';

export const marketingService = {
  async getStrategies(budget?: number) {
    const { data } = await apiClient.post('/marketing/strategies', {
      budget,
    });
    return data.data.strategies;
  },

  async getContentSuggestions(count: number = 5) {
    const { data } = await apiClient.post('/marketing/content-suggestions', {
      count,
    });
    return data.data.suggestions;
  },

  async getContentOutline(contentId: string) {
    const { data } = await apiClient.get(
      `/marketing/content-outline/${contentId}`
    );
    return data.data.outline;
  },

  async analyzeSentiment(feedback: Array<{
    text: string;
    language?: string;
    source?: string;
  }>) {
    const { data } = await apiClient.post('/marketing/sentiment-analysis', {
      feedback,
    });
    return data.data.analysis;
  },
};
```

#### Sentiment Analysis Example

```typescript
// SentimentAnalyzer.tsx
import React, { useState } from 'react';
import { marketingService } from './marketing.service';

export const SentimentAnalyzer: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  const addFeedback = () => {
    if (feedbackText.trim()) {
      setFeedbackList([...feedbackList, feedbackText]);
      setFeedbackText('');
    }
  };

  const analyzeFeedback = async () => {
    const feedback = feedbackList.map(text => ({ text }));
    const result = await marketingService.analyzeSentiment(feedback);
    setAnalysis(result);
  };

  return (
    <div className="sentiment-analyzer">
      <h2>Customer Sentiment Analysis</h2>
      
      <div className="input-section">
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Enter customer feedback..."
        />
        <button onClick={addFeedback}>Add Feedback</button>
      </div>

      <div className="feedback-list">
        <h3>Feedback Items ({feedbackList.length})</h3>
        {feedbackList.map((item, index) => (
          <div key={index} className="feedback-item">
            {item}
          </div>
        ))}
      </div>

      {feedbackList.length > 0 && (
        <button onClick={analyzeFeedback}>Analyze Sentiment</button>
      )}

      {analysis && (
        <div className="analysis-results">
          <h3>Analysis Results</h3>
          <div className="overall-score">
            Overall Score: {(analysis.overallScore * 100).toFixed(1)}%
          </div>
          <div className="distribution">
            <div>Positive: {analysis.distribution.positive.toFixed(1)}%</div>
            <div>Neutral: {analysis.distribution.neutral.toFixed(1)}%</div>
            <div>Negative: {analysis.distribution.negative.toFixed(1)}%</div>
          </div>
          {analysis.negativeIssues.length > 0 && (
            <div className="issues">
              <h4>Issues to Address:</h4>
              {analysis.negativeIssues.map((issue: any, index: number) => (
                <div key={index}>{issue.issue}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

### 6. Dashboard Integration

```typescript
// dashboard.service.ts
import { apiClient } from './api-client';

export const dashboardService = {
  async getDashboardData() {
    const { data } = await apiClient.get('/dashboard');
    return data.data;
  },

  async getMetrics() {
    const { data } = await apiClient.get('/dashboard/metrics');
    return data.data;
  },

  async getTrends(metrics: string[] = ['revenue', 'customers']) {
    const { data } = await apiClient.get('/dashboard/trends', {
      params: { metrics: metrics.join(',') },
    });
    return data.data;
  },

  async getInsights() {
    const { data } = await apiClient.get('/dashboard/insights');
    return data.data;
  },

  async refresh() {
    const { data } = await apiClient.post('/dashboard/refresh');
    return data.data;
  },
};
```

#### Dashboard Component with Auto-Refresh

```typescript
// Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { dashboardService } from './dashboard.service';

export const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await dashboardService.refresh();
    await loadDashboard();
  };

  if (loading && !dashboardData) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Business Dashboard</h1>
        <button onClick={handleRefresh}>Refresh</button>
        {lastUpdated && (
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Daily Revenue</h3>
          <p className="value">
            ₹{dashboardData?.keyMetrics.dailyRevenue.toLocaleString()}
          </p>
          <p className="change">
            {dashboardData?.keyMetrics.revenueChange > 0 ? '↑' : '↓'}
            {Math.abs(dashboardData?.keyMetrics.revenueChange).toFixed(1)}%
          </p>
        </div>
        
        <div className="metric-card">
          <h3>Total Customers</h3>
          <p className="value">{dashboardData?.keyMetrics.totalCustomers}</p>
          <p className="change">
            {dashboardData?.keyMetrics.customerChange > 0 ? '↑' : '↓'}
            {Math.abs(dashboardData?.keyMetrics.customerChange).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h2>Actionable Insights</h2>
        {dashboardData?.insights.map((insight: any) => (
          <div key={insight.id} className={`insight ${insight.priority}`}>
            <h3>{insight.title}</h3>
            <p>{insight.description}</p>
            <div className="action">
              <strong>Recommended Action:</strong> {insight.recommendedAction}
            </div>
            <div className="impact">
              <strong>Expected Impact:</strong> {insight.expectedImpact}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {dashboardData?.alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Alerts</h2>
          {dashboardData.alerts.map((alert: any) => (
            <div key={alert.id} className={`alert ${alert.type}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### 7. Conversational AI

```typescript
// ai.service.ts
import { apiClient } from './api-client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const aiService = {
  async sendQuery(query: string, previousMessages?: Message[]) {
    const { data } = await apiClient.post('/ai/query', {
      query,
      context: previousMessages ? { previousMessages } : undefined,
    });
    return data.data;
  },

  async getHistory(limit: number = 10) {
    const { data } = await apiClient.get('/ai/history', {
      params: { limit },
    });
    return data.data;
  },

  async clearContext() {
    const { data } = await apiClient.delete('/ai/context');
    return data.data;
  },
};
```

#### Chat Interface Component

```typescript
// ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { aiService, Message } from './ai.service';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load conversation history
    const loadHistory = async () => {
      const history = await aiService.getHistory(20);
      setMessages(history);
    };
    loadHistory();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.sendQuery(input, messages);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>AI Business Assistant</h2>
        <button onClick={() => aiService.clearContext()}>
          Clear History
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your business..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};
```

---

## Error Handling Patterns

### Centralized Error Handler

```typescript
// error-handler.ts
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  suggestion?: string;
  timestamp: Date;
}

export const handleApiError = (error: any): ApiError => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    suggestion: 'Please try again later',
    timestamp: new Date(),
  };
};

export const displayError = (error: ApiError) => {
  // Display user-friendly error message
  const message = error.suggestion 
    ? `${error.message}. ${error.suggestion}`
    : error.message;
  
  // Use your preferred notification system
  console.error(`[${error.code}] ${message}`);
  
  // Example with toast notification
  // toast.error(message);
};
```

### Usage in Components

```typescript
import { handleApiError, displayError } from './error-handler';

const MyComponent: React.FC = () => {
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      const result = await apiClient.get('/some-endpoint');
      setData(result.data);
    } catch (err) {
      const error = handleApiError(err);
      displayError(error);
      
      // Handle specific error codes
      if (error.code === 'PROFILE_NOT_FOUND') {
        // Redirect to profile creation
        window.location.href = '/profile/create';
      }
    }
  };

  return <div>...</div>;
};
```

---

## Performance Optimization

### Caching Strategy

```typescript
// cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMinutes: number = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const apiCache = new ApiCache();
```

### Cached Service Wrapper

```typescript
// cached-dashboard.service.ts
import { dashboardService } from './dashboard.service';
import { apiCache } from './cache';

export const cachedDashboardService = {
  async getDashboardData(forceRefresh = false) {
    const cacheKey = 'dashboard-data';
    
    if (!forceRefresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }

    const data = await dashboardService.getDashboardData();
    apiCache.set(cacheKey, data, 5); // Cache for 5 minutes
    
    return data;
  },

  async refresh() {
    apiCache.clear('dashboard');
    return this.getDashboardData(true);
  },
};
```

---

## Testing Your Integration

### Unit Testing API Calls

```typescript
// __tests__/auth.service.test.ts
import { authService } from '../auth.service';
import { apiClient } from '../api-client';

jest.mock('../api-client');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should register a new user', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          user: { id: '123', email: 'test@example.com' },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const user = await authService.register('test@example.com', 'password123');

    expect(user.email).toBe('test@example.com');
    expect(localStorage.getItem('accessToken')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
  });

  it('should handle registration errors', async () => {
    const mockError = {
      response: {
        data: {
          error: {
            code: 'USER_EXISTS',
            message: 'User already exists',
          },
        },
      },
    };

    (apiClient.post as jest.Mock).mockRejectedValue(mockError);

    await expect(
      authService.register('test@example.com', 'password123')
    ).rejects.toEqual(mockError);
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/dashboard.test.ts
import { dashboardService } from '../dashboard.service';

describe('Dashboard Integration', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Login to get access token
    const { data } = await apiClient.post('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    accessToken = data.data.tokens.accessToken;
    localStorage.setItem('accessToken', accessToken);
  });

  it('should fetch dashboard data', async () => {
    const data = await dashboardService.getDashboardData();
    
    expect(data).toHaveProperty('keyMetrics');
    expect(data).toHaveProperty('insights');
    expect(data).toHaveProperty('trends');
    expect(data.keyMetrics).toHaveProperty('dailyRevenue');
  });

  it('should refresh dashboard metrics', async () => {
    const result = await dashboardService.refresh();
    expect(result.message).toBe('Dashboard metrics refreshed successfully');
  });
});
```

---

## Mobile App Integration

### React Native Example

```typescript
// mobile/api-client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-domain.com/api';

export const mobileApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token from AsyncStorage
mobileApiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
mobileApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          await AsyncStorage.setItem('accessToken', data.data.tokens.accessToken);
          await AsyncStorage.setItem('refreshToken', data.data.tokens.refreshToken);
          
          error.config.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          // Navigate to login screen
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Webhook Integration (Future Feature)

### Setting Up Webhooks

```typescript
// webhook-handler.ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Verify webhook signature
const verifySignature = (payload: string, signature: string, secret: string) => {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
};

router.post('/webhooks/msme-assistant', (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = JSON.stringify(req.body);
  
  if (!verifySignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  switch (event) {
    case 'transaction.created':
      // Handle new transaction
      console.log('New transaction:', data);
      break;
    
    case 'insight.generated':
      // Handle new insight
      console.log('New insight:', data);
      break;
    
    case 'alert.triggered':
      // Handle alert
      console.log('Alert triggered:', data);
      break;
  }

  res.json({ received: true });
});

export default router;
```

---

## Best Practices Summary

### 1. Security
- Always use HTTPS in production
- Store tokens securely (httpOnly cookies or secure storage)
- Implement token refresh logic
- Never log sensitive data
- Validate all user input

### 2. Performance
- Cache frequently accessed data
- Use batch endpoints when possible
- Implement pagination for large datasets
- Debounce search and filter operations
- Use compression for large payloads

### 3. Error Handling
- Always handle errors gracefully
- Display user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient failures
- Use error boundaries in React

### 4. User Experience
- Show loading states
- Provide feedback for all actions
- Implement optimistic updates
- Handle offline scenarios
- Use skeleton screens for loading

### 5. Code Organization
- Separate API logic from UI components
- Use TypeScript for type safety
- Create reusable service modules
- Implement consistent error handling
- Write tests for critical paths

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:** Ensure your backend has proper CORS configuration:
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true,
}));
```

#### 2. Token Expiration
```
401 Unauthorized - Token expired
```

**Solution:** Implement automatic token refresh (see authentication examples above).

#### 3. Rate Limiting
```
429 Too Many Requests
```

**Solution:** Implement exponential backoff:
```typescript
const retryWithBackoff = async (fn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      } else {
        throw error;
      }
    }
  }
};
```

---

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Security Guide](./SECURITY.md)
- [Caching Strategy](./CACHING.md)
- [Setup Guide](../QUICKSTART.md)

---

*Last Updated: January 2024*
