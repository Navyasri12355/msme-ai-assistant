import { apiClient } from './client';
import { ApiResponse } from '../types';

// Marketing types
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

export interface FeedbackInput {
  text: string;
  language?: string;
  source?: string;
}

// Generate marketing strategies
export const generateStrategies = async (budget?: number): Promise<MarketingStrategy[]> => {
  const response = await apiClient.post<ApiResponse<{ strategies: MarketingStrategy[] }>>(
    '/marketing/strategies',
    { budget }
  );
  return response.data.data.strategies;
};

// Generate content suggestions
export const generateContentSuggestions = async (count?: number): Promise<ContentSuggestion[]> => {
  const response = await apiClient.post<ApiResponse<{ suggestions: ContentSuggestion[] }>>(
    '/marketing/content-suggestions',
    { count }
  );
  return response.data.data.suggestions;
};

// Get content outline
export const getContentOutline = async (contentId: string): Promise<string> => {
  const response = await apiClient.get<ApiResponse<{ outline: string }>>(
    `/marketing/content-outline/${contentId}`
  );
  return response.data.data.outline;
};

// Analyze sentiment
export const analyzeSentiment = async (feedback: FeedbackInput[]): Promise<SentimentAnalysis> => {
  const response = await apiClient.post<ApiResponse<{ analysis: SentimentAnalysis }>>(
    '/marketing/sentiment-analysis',
    { feedback }
  );
  return response.data.data.analysis;
};
