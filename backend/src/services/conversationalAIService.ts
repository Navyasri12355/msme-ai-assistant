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
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  private static genAI: GoogleGenerativeAI | null = null;

  /**
   * Initialize Gemini AI if API key is available
   */
  private static initializeGemini(): void {
    if (!this.genAI && config.ai.googleApiKey) {
      this.genAI = new GoogleGenerativeAI(config.ai.googleApiKey);
    }
  }

  /**
   * Use Poe API to generate AI responses
   */
  private static async enhanceWithPoe(
    prompt: string,
    context?: string,
    botName: string = config.ai.poeBot
  ): Promise<string | null> {
    try {
      if (!config.ai.poeApiKey) {
        return null; // Fall back to other methods
      }

      const systemPrompt = `You are a business advisor AI assistant for small and medium enterprises (MSMEs). 
Your role is to provide practical, actionable business advice based on the user's data and context.

Key guidelines:
- Be concise but comprehensive (2-3 paragraphs max)
- Focus on actionable recommendations
- Use specific numbers and data when available
- Maintain a professional yet friendly tone
- Prioritize cost-effective solutions for small businesses`;

      const fullPrompt = context 
        ? `${systemPrompt}\n\nBusiness Context: ${context}\n\nUser Query: ${prompt}`
        : `${systemPrompt}\n\nUser Query: ${prompt}`;

      const response = await axios.post('https://api.poe.com/bot/chat', {
        bot: botName,
        query: fullPrompt,
        conversation_id: null, // Start new conversation each time
      }, {
        headers: {
          'Authorization': `Bearer ${config.ai.poeApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      return response.data.text || null;
    } catch (error: any) {
      console.error('Poe API error:', error.response?.data || error.message);
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
    // Try Poe first (if available)
    const poeResponse = await this.enhanceWithPoe(prompt, context);
    if (poeResponse) {
      return poeResponse;
    }

    // Fall back to Gemini
    const geminiResponse = await this.enhanceWithGemini(prompt, context);
    if (geminiResponse) {
      return geminiResponse;
    }

    // No AI available
    return null;
  }

  /**
   * Use Gemini to enhance response with AI-generated content
   */
  private static async enhanceWithGemini(
    prompt: string,
    context?: string
  ): Promise<string | null> {
    try {
      this.initializeGemini();
      
      if (!this.genAI) {
        return null; // Fall back to rule-based responses
      }

      const model = this.genAI.getGenerativeModel({ model: config.ai.geminiModel });
      
      const fullPrompt = context 
        ? `Context: ${context}\n\nUser Query: ${prompt}\n\nProvide a helpful, concise business advice response in 2-3 paragraphs.`
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return null; // Fall back to rule-based responses
    }
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
        message: 'I didn\'t receive a question. Could you please ask me something about your business?',
        requiresClarification: false,
      };
    }

    // Check query length
    if (query.length > 500) {
      return {
        message: 'Your question is quite long. Could you please rephrase it in a shorter way?',
        requiresClarification: false,
      };
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Detect query intent
    const intent = this.detectIntent(normalizedQuery);

    // Check if query is out of domain
    if (intent === 'out_of_domain') {
      return {
        message: 'I specialize in helping with business-related questions like financial analysis, marketing strategies, and business insights. Could you ask me something about your business operations, finances, or marketing?',
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
        message: 'I want to help, but I need a bit more information to give you the best answer.',
        requiresClarification: true,
        clarificationQuestions: this.getClarificationQuestions(intent),
      };
    }

    // Build comprehensive user context
    const userContext = await this.buildUserContext(userId);

    // Process based on intent with full context awareness
    try {
      const businessProfile = context?.userBusinessProfile;
      
      switch (intent) {
        case 'cost_cutting':
          return await this.handleCostCuttingQuery(userId, businessProfile, userContext);
        
        case 'growth_strategy':
          return await this.handleGrowthStrategyQuery(userId, businessProfile, userContext);
        
        case 'financial_analysis':
          return await this.handleFinancialAnalysisQuery(userId, userContext);
        
        case 'marketing_advice':
          return await this.handleMarketingAdviceQuery(userId, businessProfile, userContext);
        
        case 'business_insights':
          return await this.handleBusinessInsightsQuery(userId, userContext);
        
        default:
          // For general queries, use AI with full context
          const aiResponse = await this.getAIResponse(
            `The user is asking: "${query}". Provide helpful business advice based on their context.`,
            userContext
          );
          
          if (aiResponse) {
            return {
              message: aiResponse,
              suggestions: [
                'Show me my financial performance',
                'How can I grow my business?',
                'What marketing strategies should I use?',
                'How can I reduce costs?',
              ],
              requiresClarification: false,
            };
          }

          return {
            message: 'I can help you with various aspects of your business. Based on your profile and transaction history, I can provide personalized advice. What would you like to know about?',
            suggestions: [
              'Financial analysis and forecasting',
              'Marketing strategies and content ideas',
              'Cost reduction opportunities',
              'Growth strategies',
              'Business performance insights',
            ],
            requiresClarification: false,
          };
      }
    } catch (error) {
      return {
        message: 'I encountered an issue while processing your request. Please try again or rephrase your question.',
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
    const recommendations: string[] = [];
    const dataReferences: DataReference[] = [];

    // Use comprehensive user context
    const contextInfo = userContext || '';

    // Try to use AI for enhanced response with full context
    const aiPrompt = `The user is asking for cost-cutting advice. Based on their business profile and financial data, provide 3-5 specific, actionable cost-cutting recommendations. Focus on practical strategies that can be implemented immediately and are relevant to their specific situation.`;
    const aiResponse = await this.getAIResponse(aiPrompt, contextInfo);

    let message: string;
    
    if (aiResponse) {
      // Use AI-generated response
      message = aiResponse;
    } else {
      // Fall back to rule-based recommendations
      recommendations.push(
        'Review your recurring expenses and negotiate better rates with suppliers',
        'Optimize inventory management to reduce waste and storage costs',
        'Consider energy-efficient equipment to lower utility bills'
      );

      if (businessProfile) {
        if (businessProfile.industry === 'retail' || businessProfile.industry === 'food-beverage') {
          recommendations.push(
            'Implement just-in-time inventory to reduce spoilage and storage costs',
            'Use digital marketing instead of traditional advertising to reduce marketing expenses'
          );
        }
        
        if (businessProfile.employeeCount > 5) {
          recommendations.push(
            'Cross-train employees to improve flexibility and reduce overtime costs'
          );
        }
      }

      message = `Based on your business, here are specific cost-cutting strategies:\n\n${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n\n')}`;
    }

    return {
      message,
      suggestions: [
        'Show me my expense breakdown',
        'What are my biggest expenses?',
        'How can I improve my profit margin?',
      ],
      requiresClarification: false,
      dataReferences: dataReferences.length > 0 ? dataReferences : undefined,
    };
  }

  /**
   * Handle growth strategy related queries
   */
  private static async handleGrowthStrategyQuery(
    userId: string,
    businessProfile?: BusinessProfile,
    userContext?: string
  ): Promise<AIResponse> {
    const dataReferences: DataReference[] = [];

    // Use comprehensive user context
    const contextInfo = userContext || '';

    // Try to use AI for enhanced response with full context
    const aiPrompt = `The user is asking for growth strategies. Based on their business profile, financial performance, and transaction history, provide 3-5 specific, actionable growth strategies. Focus on practical, cost-effective strategies that can help expand their customer base and increase revenue.`;
    const aiResponse = await this.getAIResponse(aiPrompt, contextInfo);

    if (aiResponse) {
      // Use AI-generated response
      return {
        message: aiResponse,
        suggestions: [
          'What marketing strategies should I use?',
          'How can I attract more customers?',
          'Show me my business performance',
        ],
        requiresClarification: false,
        dataReferences: dataReferences.length > 0 ? dataReferences : undefined,
      };
    }

    // Fall back to generic growth strategies if AI is unavailable
    const strategies: string[] = [
      'Expand your customer base through targeted local marketing campaigns',
      'Leverage social media to reach more potential customers',
      'Develop partnerships with complementary businesses',
      'Focus on customer retention and repeat business',
      'Optimize your pricing strategy based on market research',
    ];

    const message = `Here are growth strategies for your business:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`;

    return {
      message,
      suggestions: [
        'What marketing strategies should I use?',
        'How can I attract more customers?',
        'Show me my business performance',
      ],
      requiresClarification: false,
      dataReferences: dataReferences.length > 0 ? dataReferences : undefined,
    };
  }

  /**
   * Handle financial analysis queries
   */
  private static async handleFinancialAnalysisQuery(
    userId: string,
    userContext?: string
  ): Promise<AIResponse> {
    try {
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

      // Fallback to basic metrics if AI is unavailable
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const metrics = await FinanceService.calculateMetrics(userId, { startDate, endDate });
      
      const message = `Here's your financial summary for the last month:\n\n` +
        `💰 Total Income: ₹${metrics.totalIncome.toLocaleString()}\n` +
        `💸 Total Expenses: ₹${metrics.totalExpenses.toLocaleString()}\n` +
        `📊 Net Profit: ₹${metrics.netProfit.toLocaleString()}\n` +
        `📈 Profit Margin: ${metrics.profitMargin.toFixed(1)}%\n\n` +
        `${metrics.netProfit > 0 ? 'Great job! Your business is profitable.' : 'Your expenses exceed income. Let\'s work on improving this.'}`;

      return {
        message,
        suggestions: [
          'Show me my cash flow forecast',
          'How can I reduce costs?',
          'What are my biggest expenses?',
        ],
        requiresClarification: false,
        dataReferences: [
          {
            type: 'metric',
            id: 'financial-summary',
            value: metrics,
          },
        ],
      };
    } catch (error) {
      return {
        message: 'I need transaction data to provide financial analysis. Please upload your transactions first.',
        suggestions: ['How do I upload transactions?'],
        requiresClarification: false,
      };
    }
  }

  /**
   * Handle marketing advice queries
   */
  private static async handleMarketingAdviceQuery(
    userId: string,
    businessProfile?: BusinessProfile,
    userContext?: string
  ): Promise<AIResponse> {
    try {
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

      // Fallback to rule-based strategies if AI is unavailable
      if (businessProfile) {
        const strategies = await MarketingService.generateStrategies(businessProfile);
        
        const topStrategies = strategies.slice(0, 3);
        const strategyList = topStrategies.map((s, i) => 
          `${i + 1}. ${s.title} (Cost: ₹${s.estimatedCost.toLocaleString()})\n   ${s.description}`
        ).join('\n\n');

        const message = `Here are the top marketing strategies for your business:\n\n${strategyList}\n\nWould you like detailed action steps for any of these strategies?`;

        return {
          message,
          suggestions: [
            'Show me content ideas',
            'How can I use social media effectively?',
            'What\'s my marketing budget?',
          ],
          requiresClarification: false,
          dataReferences: [
            {
              type: 'metric',
              id: 'marketing-strategies',
              value: topStrategies,
            },
          ],
        };
      }

      return {
        message: 'I can help you with marketing strategies. What specific aspect of marketing are you interested in?',
        suggestions: [
          'Social media marketing',
          'Content creation ideas',
          'Customer engagement strategies',
        ],
        requiresClarification: false,
      };
    } catch (error) {
      return {
        message: 'I can help you with marketing strategies. What specific aspect of marketing are you interested in?',
        suggestions: [
          'Social media marketing',
          'Content creation ideas',
          'Customer engagement strategies',
        ],
        requiresClarification: false,
      };
    }
  }

  /**
   * Handle business insights queries
   */
  private static async handleBusinessInsightsQuery(
    userId: string,
    userContext?: string
  ): Promise<AIResponse> {
    try {
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

      // Fallback to dashboard insights if AI is unavailable
      const dashboardData = await DashboardService.getDashboardData(userId);
      
      const insights = dashboardData.insights.slice(0, 3);
      const insightList = insights.map((insight, i) => 
        `${i + 1}. ${insight.title}\n   ${insight.description}\n   💡 Action: ${insight.recommendedAction}`
      ).join('\n\n');

      const message = `Here are the key insights about your business:\n\n${insightList}`;

      return {
        message,
        suggestions: [
          'Show me my dashboard',
          'What are my alerts?',
          'How is my business performing?',
        ],
        requiresClarification: false,
        dataReferences: [
          {
            type: 'insight',
            id: 'business-insights',
            value: insights,
          },
        ],
      };
    } catch (error) {
      return {
        message: 'I need more business data to generate insights. Please ensure you have uploaded transactions and completed your business profile.',
        suggestions: [
          'Upload transactions',
          'Complete business profile',
        ],
        requiresClarification: false,
      };
    }
  }

  /**
   * Get conversation history for a user
   */
  static async getConversationHistory(
    userId: string,
    limit: number = 10
  ): Promise<Message[]> {
    // In a real implementation, this would fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Clear conversation context for a user
   */
  static async clearContext(userId: string): Promise<void> {
    // In a real implementation, this would clear from database/cache
    // For now, this is a no-op
    return;
  }
}
