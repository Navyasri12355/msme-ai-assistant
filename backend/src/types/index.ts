// Common types used across the application

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin: Date | null;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  industry: string;
  location: string;
  targetAudience: string;
  monthlyRevenue?: number;
  employeeCount: number;
  establishedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
  suggestion?: string;
  timestamp: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  paymentMethod?: string;
  customerId?: string;
  productId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionData {
  userId: string;
  amount: number;
  type?: 'income' | 'expense';
  category?: string;
  description: string;
  date: Date;
  paymentMethod?: string;
  customerId?: string;
  productId?: string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  type?: 'income' | 'expense';
}

// Marketing Advisor Types
export interface MarketingStrategy {
  id: string;
  title: string;
  description: string;
  estimatedCost: number;
  expectedReach: number;
  difficulty: 'low' | 'medium' | 'high';
  actionSteps: string[];
  timeline: string;
}

export interface MarketingStrategyRequest {
  budget?: number;
}

// Content Suggestion Types
export interface ContentSuggestion {
  id: string;
  title: string;
  platform: 'social' | 'email' | 'blog' | 'sms';
  contentType: string;
  outline: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  potentialReach: number;
  relevance: string;
}

export interface ContentSuggestionRequest {
  count?: number;
}

// Sentiment Analysis Types
export interface CustomerFeedback {
  id: string;
  text: string;
  language: string;
  source: string;
  date: Date;
}

export interface SentimentAnalysis {
  overallScore: number;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keyTopics: TopicSentiment[];
  negativeIssues: Issue[];
  languageBreakdown: LanguageSentiment[];
}

export interface TopicSentiment {
  topic: string;
  frequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface Issue {
  description: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
}

export interface LanguageSentiment {
  language: string;
  count: number;
  averageSentiment: number;
}

export interface SentimentAnalysisRequest {
  feedback: Array<{
    text: string;
    language?: string;
    source?: string;
  }>;
}

// Conversational AI Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  previousMessages: Message[];
  userBusinessProfile?: BusinessProfile;
  currentTopic?: string;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  dataReferences?: DataReference[];
}

export interface DataReference {
  type: 'metric' | 'transaction' | 'forecast' | 'insight';
  id: string;
  value: any;
}

export interface QueryRequest {
  query: string;
  context?: ConversationContext;
}
