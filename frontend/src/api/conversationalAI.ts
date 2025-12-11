import { apiClient } from './client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

export interface ConversationContext {
  previousMessages: Message[];
  userBusinessProfile?: any;
  currentTopic?: string;
}

export interface QueryRequest {
  query: string;
  context?: ConversationContext;
}

export const conversationalAIApi = {
  /**
   * Send a query to the conversational AI
   */
  sendQuery: async (query: string, context?: ConversationContext): Promise<AIResponse> => {
    const response = await apiClient.post<{ success: boolean; data: AIResponse }>(
      '/ai/query',
      { query, context }
    );
    return response.data.data;
  },

  /**
   * Get conversation history
   */
  getHistory: async (limit?: number): Promise<Message[]> => {
    const response = await apiClient.get<{ success: boolean; data: Message[] }>(
      '/ai/history',
      { params: { limit } }
    );
    return response.data.data;
  },

  /**
   * Clear conversation context
   */
  clearContext: async (): Promise<void> => {
    await apiClient.delete('/ai/context');
  },
};
