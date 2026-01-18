import {
  BusinessProfile,
  AIResponse,
  ConversationContext,
  Message,
  DataReference,
} from '../types';
import { FinanceService } from './financeService';
import { MarketingService } from './marketingService';
import { DashboardService } from './dashboardService';
import { initOpenRouter, createChatCompletion, isInitialized } from './openrouterClient';
import config from '../config/env';
import axios from 'axios';
import { pool } from '../config/database';
import { TransactionModel } from '../models/Transaction';
import { BusinessProfileModel } from '../models/BusinessProfile';

/**
 * Conversational AI Service
 * Processes natural language business queries and provides contextual responses
 */
export class ConversationalAIService {
  private static initialized: boolean = false;

  /**
   * Initialize OpenRouter HTTP adapter if API key is available
   */
  private static initializeOpenRouter(): void {
    if (!this.initialized && config.ai.openrouterApiKey) {
      initOpenRouter(config.ai.openrouterApiKey);
      this.initialized = isInitialized();
    }
  }

  

  /**
   * Use OpenRouter model to generate AI responses
   */
  private static async enhanceWithOpenRouter(
    prompt: string,
    context?: string
  ): Promise<string | null> {
    try {
      this.initializeOpenRouter();
      
      if (!this.initialized) {
        return null; // Fall back to other methods
      }

      const systemPrompt = `You are a business advisor AI assistant for small and medium enterprises (MSMEs). 
Your role is to provide practical, actionable business advice based on the user's data and context.

Key guidelines:
- Be concise but comprehensive (2-3 paragraphs max)
- Focus on actionable recommendations
- Use specific numbers and data when available
- Maintain a professional yet friendly tone
- Prioritize cost-effective solutions for small businesses
- Provide step-by-step guidance when appropriate
- Reference the user's specific business context when giving advice`;

      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      if (context) {
        messages.push({
          role: 'user',
          content: `Business Context: ${context}`,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      // Use HTTP adapter to call OpenRouter
      const completion = await createChatCompletion({
        model: config.ai.openrouterModel,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
      });

      // Normalize response (depends on provider shape)
      return completion.choices?.[0]?.message?.content || completion?.response || null;
    } catch (error: any) {
      console.error('OpenRouter API error:', error.message);
      return null; // Fall back to other methods
    }
  }


  /**
   * Enhanced AI response with multiple fallback options
   */
  private static async getAIResponse(
    prompt: string,
    context?: string
  ): Promise<string | null> {
    // Try OpenRouter model first (if available)
    const openrouterResponse = await this.enhanceWithOpenRouter(prompt, context);
    if (openrouterResponse) {
      return openrouterResponse;
    }

    // No AI available
    return null;
  }


  /**
   * Build comprehensive user context automatically
   */
  static async buildUserContext(userId: string): Promise<string> {
    try {
      const contextParts: string[] = [];

      // 1. Get user basic info
      const userResult = await pool.query(
        'SELECT email, created_at FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const memberSince = new Date(user.created_at).toLocaleDateString();
        contextParts.push(`User: ${user.email} (member since ${memberSince})`);
      }

      // 2. Get business profile
      const businessProfile = await BusinessProfileModel.findByUserId(userId);
      if (businessProfile) {
        contextParts.push(
          `Business: ${businessProfile.businessName}`,
          `Industry: ${businessProfile.industry}`,
          `Business Type: ${businessProfile.businessType}`,
          `Location: ${businessProfile.location}`,
          `Target Audience: ${businessProfile.targetAudience}`,
          `Employee Count: ${businessProfile.employeeCount}`,
          `Monthly Revenue: ₹${businessProfile.monthlyRevenue?.toLocaleString() || 'Not specified'}`
        );
      }

      // 3. Get recent financial summary (last 30 days)
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const recentTransactions = await TransactionModel.findByUser(userId, {
          startDate,
          endDate,
        });

        if (recentTransactions.length > 0) {
          const metrics = FinanceService.calculateMetricsFromTransactions(
            recentTransactions,
            { startDate, endDate }
          );

          contextParts.push(
            `\nRecent Financial Performance (Last 30 days):`,
            `Total Income: ₹${metrics.totalIncome.toLocaleString()}`,
            `Total Expenses: ₹${metrics.totalExpenses.toLocaleString()}`,
            `Net Profit: ₹${metrics.netProfit.toLocaleString()}`,
            `Profit Margin: ${metrics.profitMargin.toFixed(1)}%`,
            `Transaction Count: ${recentTransactions.length}`
          );

          // Add top expense categories
          const expenseCategories = metrics.categoryBreakdown
            .filter(cat => cat.category !== 'Uncategorized')
            .slice(0, 3);
          
          if (expenseCategories.length > 0) {
            contextParts.push(
              `Top Expense Categories: ${expenseCategories.map(cat => 
                `${cat.category} (₹${cat.total.toLocaleString()})`
              ).join(', ')}`
            );
          }
        }
      } catch (error) {
        // Continue without financial data if there's an error
      }

      // 4. Get recent business insights
      try {
        const dashboardData = await DashboardService.getDashboardData(userId);
        
        if (dashboardData.insights.length > 0) {
          const topInsights = dashboardData.insights.slice(0, 2);
          contextParts.push(
            `\nRecent Business Insights:`,
            ...topInsights.map(insight => 
              `- ${insight.title}: ${insight.description}`
            )
          );
        }

        // Add key metrics trends
        if (dashboardData.keyMetrics.revenueChange !== undefined) {
          const trend = dashboardData.keyMetrics.revenueChange >= 0 ? 'growing' : 'declining';
          contextParts.push(
            `Revenue Trend: ${trend} by ${Math.abs(dashboardData.keyMetrics.revenueChange).toFixed(1)}%`
          );
        }
      } catch (error) {
        // Continue without insights if there's an error
      }

      // 5. Get recent transaction patterns
      try {
        const allTransactions = await TransactionModel.findByUser(userId);
        
        if (allTransactions.length > 0) {
          const totalTransactions = allTransactions.length;
          const incomeTransactions = allTransactions.filter(t => t.type === 'income').length;
          const expenseTransactions = allTransactions.filter(t => t.type === 'expense').length;
          
          contextParts.push(
            `\nTransaction History:`,
            `Total Transactions: ${totalTransactions}`,
            `Income Transactions: ${incomeTransactions}`,
            `Expense Transactions: ${expenseTransactions}`
          );

          // Get most common categories
          const categoryCount = new Map<string, number>();
          allTransactions.forEach(t => {
            if (t.category) {
              categoryCount.set(t.category, (categoryCount.get(t.category) || 0) + 1);
            }
          });

          const topCategories = Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          if (topCategories.length > 0) {
            contextParts.push(
              `Most Active Categories: ${topCategories.map(([cat, count]) => 
                `${cat} (${count} transactions)`
              ).join(', ')}`
            );
          }
        }
      } catch (error) {
        // Continue without transaction patterns if there's an error
      }

      return contextParts.join('\n');
    } catch (error) {
      console.error('Error building user context:', error);
      return 'User context unavailable';
    }
  }

  /**
   * Process a user query and generate a response with full context awareness
   */
  static async processQuery(
    userId: string,
    query: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    // Validate query
    if (!query || query.trim().length === 0) {
      return {
        message: 'Please ask me a question about your business.',
        requiresClarification: false,
      };
    }

    // Check query length
    if (query.length > 500) {
      return {
        message: 'Please keep your question under 500 characters.',
        requiresClarification: false,
      };
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Get recent conversation history for context
    const conversationHistory = await this.getConversationHistory(userId, 5);
    
    // Build comprehensive user context
    const userContext = await this.buildUserContext(userId);
    
    // Check if this is a follow-up question
    const isFollowUp = this.isFollowUpQuestion(normalizedQuery, conversationHistory);
    
    if (isFollowUp) {
      return await this.handleFollowUpQuestion(userId, query, conversationHistory, userContext);
    }

    // Detect query intent
    const intent = this.detectIntent(normalizedQuery);

    // Check if query is out of domain
    if (intent === 'out_of_domain') {
      return {
        message: 'I specialize in business advice. Please ask about your finances, marketing, operations, or growth strategies.',
        suggestions: [
          'How can I reduce my costs?',
          'What marketing strategies would work for my business?',
          'Show me my financial performance',
          'How can I grow my business?',
        ],
        requiresClarification: false,
      };
    }

    // Check if query is ambiguous
    if (this.isAmbiguous(normalizedQuery)) {
      return {
        message: 'Could you be more specific about what you\'d like to know?',
        requiresClarification: true,
        clarificationQuestions: this.getClarificationQuestions(intent),
      };
    }

    // Process with AI - no fallbacks
    try {
      const businessProfile = context?.userBusinessProfile;
      const conversationContext = this.buildConversationContext(conversationHistory);
      
      // Create comprehensive prompt based on intent
      let aiPrompt = '';
      switch (intent) {
        case 'cost_cutting':
          aiPrompt = `The user is asking for cost-cutting advice. Based on their business profile and financial data, provide 3-5 specific, actionable cost-cutting recommendations. Focus on practical strategies that can be implemented immediately.`;
          break;
        case 'growth_strategy':
          aiPrompt = `The user is asking for growth strategies. Based on their business profile, financial performance, and transaction history, provide 3-5 specific, actionable growth strategies. Focus on practical, cost-effective strategies.`;
          break;
        case 'financial_analysis':
          aiPrompt = `The user is asking for financial analysis. Based on their transaction history and business data, provide a comprehensive financial analysis with insights, trends, and actionable recommendations.`;
          break;
        case 'marketing_advice':
          aiPrompt = `The user is asking for marketing advice. Based on their business profile, industry, target audience, and financial performance, provide specific, actionable marketing strategies and recommendations.`;
          break;
        case 'business_insights':
          aiPrompt = `The user is asking for business insights. Based on their complete business profile, financial performance, transaction history, and trends, provide key insights about their business performance and opportunities.`;
          break;
        default:
          aiPrompt = `The user is asking: "${query}". Provide helpful business advice based on their context.`;
      }

      const aiResponse = await this.getAIResponse(
        aiPrompt,
        `${userContext}\n\nRecent conversation:\n${conversationContext}`
      );
      
      if (aiResponse) {
        return {
          message: aiResponse,
          suggestions: [
            'Tell me more about this',
            'What are the next steps?',
            'How do I implement this?',
            'What else should I consider?',
          ],
          requiresClarification: false,
        };
      }

      // If AI is unavailable, return error
      throw new Error('AI service unavailable');
      
    } catch (error) {
      return {
        message: 'I\'m currently unable to process your request. Please ensure the AI service is properly configured and try again.',
        requiresClarification: false,
      };
    }
  }

  /**
   * Detect the intent of the user query
   */
  private static detectIntent(query: string): string {
    const costKeywords = ['cost', 'expense', 'reduce', 'save', 'cut', 'cheaper', 'budget', 'spending'];
    const growthKeywords = ['grow', 'growth', 'expand', 'scale', 'increase', 'revenue', 'sales', 'customers'];
    const financialKeywords = ['finance', 'financial', 'money', 'profit', 'income', 'cash flow', 'forecast'];
    const marketingKeywords = ['market', 'marketing', 'advertise', 'promote', 'customer', 'social media'];
    const insightKeywords = ['insight', 'performance', 'dashboard', 'metrics', 'analytics', 'report'];
    
    const businessKeywords = [
      ...costKeywords,
      ...growthKeywords,
      ...financialKeywords,
      ...marketingKeywords,
      ...insightKeywords,
    ];

    // Check if query contains any business-related keywords
    const hasBusinessKeyword = businessKeywords.some(keyword => query.includes(keyword));
    
    if (!hasBusinessKeyword) {
      return 'out_of_domain';
    }

    // Determine specific intent
    if (costKeywords.some(keyword => query.includes(keyword))) {
      return 'cost_cutting';
    }
    
    if (growthKeywords.some(keyword => query.includes(keyword))) {
      return 'growth_strategy';
    }
    
    if (financialKeywords.some(keyword => query.includes(keyword))) {
      return 'financial_analysis';
    }
    
    if (marketingKeywords.some(keyword => query.includes(keyword))) {
      return 'marketing_advice';
    }
    
    if (insightKeywords.some(keyword => query.includes(keyword))) {
      return 'business_insights';
    }

    return 'general';
  }

  /**
   * Check if query is ambiguous and needs clarification
   */
  private static isAmbiguous(query: string): boolean {
    // Very short queries (1-2 words) are likely ambiguous
    const words = query.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= 2) {
      return true;
    }

    // Queries with only generic words
    const genericWords = ['help', 'tell', 'show', 'what', 'how', 'business', 'me', 'my'];
    const genericWordCount = words.filter(word => genericWords.includes(word)).length;
    
    // If more than 60% of words are generic, it's ambiguous
    return genericWordCount / words.length > 0.6;
  }

  /**
   * Get clarification questions based on intent
   */
  private static getClarificationQuestions(intent: string): string[] {
    const questions: Record<string, string[]> = {
      cost_cutting: [
        'Which area of your business would you like to reduce costs in?',
        'Are you looking for immediate savings or long-term cost optimization?',
      ],
      growth_strategy: [
        'What aspect of growth are you interested in - revenue, customers, or market reach?',
        'Are you looking for short-term tactics or long-term strategy?',
      ],
      financial_analysis: [
        'Would you like to see your current financial performance or future forecasts?',
        'Which time period are you interested in analyzing?',
      ],
      marketing_advice: [
        'Are you looking for marketing strategies, content ideas, or customer feedback analysis?',
        'What is your approximate marketing budget?',
      ],
      business_insights: [
        'Which metrics are you most interested in - sales, customers, or overall performance?',
        'Are you looking for current status or trends over time?',
      ],
    };

    return questions[intent] || [
      'Could you provide more details about what you\'d like to know?',
      'What specific aspect of your business are you asking about?',
    ];
  }

  /**
   * Handle cost-cutting related queries
   */
  private static async handleCostCuttingQuery(
    userId: string,
    businessProfile?: BusinessProfile,
    userContext?: string
  ): Promise<AIResponse> {
    const contextInfo = userContext || '';

    // Use AI for enhanced response with full context
    const aiPrompt = `The user is asking for cost-cutting advice. Based on their business profile and financial data, provide 3-5 specific, actionable cost-cutting recommendations. Focus on practical strategies that can be implemented immediately and are relevant to their specific situation. Include specific steps and expected savings where possible.`;
    const aiResponse = await this.getAIResponse(aiPrompt, contextInfo);

    if (aiResponse) {
      return {
        message: aiResponse,
        suggestions: [
          'How can I optimize inventory management?',
          'What are my biggest expenses?',
          'How can I negotiate better supplier rates?',
          'Show me energy-saving opportunities',
        ],
        requiresClarification: false,
      };
    }

    throw new Error('AI service unavailable for cost-cutting analysis');
  }

  /**
   * Handle growth strategy related queries
   */
  private static async handleGrowthStrategyQuery(
    userId: string,
    businessProfile?: BusinessProfile,
    userContext?: string
  ): Promise<AIResponse> {
    const contextInfo = userContext || '';

    // Use AI for enhanced response with full context
    const aiPrompt = `The user is asking for growth strategies. Based on their business profile, financial performance, and transaction history, provide 3-5 specific, actionable growth strategies. Focus on practical, cost-effective strategies that can help expand their customer base and increase revenue.`;
    const aiResponse = await this.getAIResponse(aiPrompt, contextInfo);

    if (aiResponse) {
      return {
        message: aiResponse,
        suggestions: [
          'What marketing strategies should I use?',
          'How can I attract more customers?',
          'Show me my business performance',
        ],
        requiresClarification: false,
      };
    }

    throw new Error('AI service unavailable for growth strategy analysis');
  }

  /**
   * Handle financial analysis queries
   */
  private static async handleFinancialAnalysisQuery(
    userId: string,
    userContext?: string
  ): Promise<AIResponse> {
    // Use AI to provide comprehensive financial analysis with context
    const aiPrompt = `The user is asking for financial analysis. Based on their transaction history and business data, provide a comprehensive financial analysis with insights, trends, and actionable recommendations.`;
    const aiResponse = await this.getAIResponse(aiPrompt, userContext || '');

    if (aiResponse) {
      return {
        message: aiResponse,
        suggestions: [
          'Show me my cash flow forecast',
          'How can I reduce costs?',
          'What are my biggest expenses?',
          'How can I improve my profit margin?',
        ],
        requiresClarification: false,
      };
    }

    throw new Error('AI service unavailable for financial analysis');
  }

  /**
   * Handle marketing advice queries
   */
  private static async handleMarketingAdviceQuery(
    userId: string,
    businessProfile?: BusinessProfile,
    userContext?: string
  ): Promise<AIResponse> {
    // Use AI to provide personalized marketing advice with full context
    const aiPrompt = `The user is asking for marketing advice. Based on their business profile, industry, target audience, and financial performance, provide specific, actionable marketing strategies and recommendations.`;
    const aiResponse = await this.getAIResponse(aiPrompt, userContext || '');

    if (aiResponse) {
      return {
        message: aiResponse,
        suggestions: [
          'Show me content ideas',
          'How can I use social media effectively?',
          'What\'s my marketing budget?',
          'How can I reach more customers?',
        ],
        requiresClarification: false,
      };
    }

    throw new Error('AI service unavailable for marketing advice');
  }

  /**
   * Handle business insights queries
   */
  private static async handleBusinessInsightsQuery(
    userId: string,
    userContext?: string
  ): Promise<AIResponse> {
    // Use AI to provide comprehensive business insights with full context
    const aiPrompt = `The user is asking for business insights. Based on their complete business profile, financial performance, transaction history, and trends, provide key insights about their business performance, opportunities, and recommendations for improvement.`;
    const aiResponse = await this.getAIResponse(aiPrompt, userContext || '');

    if (aiResponse) {
      return {
        message: aiResponse,
        suggestions: [
          'Show me my dashboard',
          'What are my alerts?',
          'How is my business performing?',
          'What opportunities should I focus on?',
        ],
        requiresClarification: false,
      };
    }

    throw new Error('AI service unavailable for business insights');
  }

  /**
   * Get conversation history for a user
   */
  static async getConversationHistory(
    userId: string,
    limit: number = 10
  ): Promise<Message[]> {
    try {
      const result = await pool.query(
        `SELECT id, role, content, timestamp 
         FROM conversations 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         LIMIT $2`,
        [userId, limit]
      );

      // Ensure we return messages in chronological order (oldest first)
      // The query above fetches the latest N messages (newest first), so reverse them
      const rows = result.rows.reverse();

      return rows.map(row => ({
        id: row.id,
        role: row.role as 'user' | 'assistant',
        content: row.content,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Check if the current query is a follow-up to previous conversation
   */
  private static isFollowUpQuestion(query: string, conversationHistory: Message[]): boolean {
    if (conversationHistory.length === 0) {
      return false;
    }

    // Get the last assistant message
    const lastAssistantMessage = conversationHistory.find(msg => msg.role === 'assistant');
    if (!lastAssistantMessage) {
      return false;
    }

    // Keywords that indicate follow-up questions
    const followUpKeywords = [
      'how can i', 'tell me more', 'expand on', 'more details', 'specifically',
      'what about', 'how do i', 'can you explain', 'more about', 'elaborate',
      'optimize', 'improve', 'implement', 'steps', 'guide', 'process'
    ];

    // Check if query contains follow-up keywords
    const hasFollowUpKeyword = followUpKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    if (!hasFollowUpKeyword) {
      return false;
    }

    // Check if the query references something from the previous response
    const lastResponse = lastAssistantMessage.content.toLowerCase();
    
    // Common topics that might be referenced
    const topics = [
      'inventory', 'cost', 'expense', 'marketing', 'social media', 'customer',
      'revenue', 'profit', 'growth', 'strategy', 'management', 'optimization',
      'advertising', 'promotion', 'sales', 'budget', 'finance', 'cash flow'
    ];

    // Check if query mentions a topic that was in the previous response
    const queryMentionsTopic = topics.some(topic => 
      query.toLowerCase().includes(topic) && lastResponse.includes(topic)
    );

    return queryMentionsTopic;
  }

  /**
   * Handle follow-up questions with context from previous conversation
   */
  private static async handleFollowUpQuestion(
    userId: string,
    query: string,
    conversationHistory: Message[],
    userContext: string
  ): Promise<AIResponse> {
    // Build conversation context
    const conversationContext = this.buildConversationContext(conversationHistory);
    
    // Create a comprehensive prompt for the AI
    const followUpPrompt = `The user is asking a follow-up question: "${query}"
    
Previous conversation context:
${conversationContext}

User's business context:
${userContext}

This appears to be a follow-up question asking for more specific details or implementation steps. Please provide a detailed, actionable response that directly addresses their follow-up question while building on the previous conversation. Focus on practical, step-by-step guidance.`;

    // Try to get AI response with full context
    const aiResponse = await this.getAIResponse(followUpPrompt);
    
    if (aiResponse) {
      return {
        message: aiResponse,
        suggestions: [
          'What are the next steps?',
          'How do I implement this?',
          'What tools do I need?',
          'How long will this take?',
        ],
        requiresClarification: false,
      };
    }

    // If AI is unavailable, return error
    throw new Error('AI service unavailable for follow-up questions');
  }

  /**
   * Build conversation context string from message history
   */
  private static buildConversationContext(conversationHistory: Message[]): string {
    if (conversationHistory.length === 0) {
      return 'No previous conversation';
    }

    // Get last 3 messages for context
    const recentMessages = conversationHistory.slice(0, 6); // 3 exchanges
    
    return recentMessages
      .reverse() // Show in chronological order
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Clear conversation context for a user
   */
  static async clearContext(userId: string): Promise<void> {
    try {
      // Remove all stored conversation messages for this user so that
      // after clearing context and refreshing the UI, history no longer reloads.
      await pool.query(
        `DELETE FROM conversations WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      console.error('Error clearing conversation context:', error);
      // Surface the error to caller by re-throwing so callers can handle it
      throw error;
    }
  }
}
