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
   * Process a user query and generate a response
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

    // Process based on intent
    try {
      const businessProfile = context?.userBusinessProfile;
      
      switch (intent) {
        case 'cost_cutting':
          return await this.handleCostCuttingQuery(userId, businessProfile);
        
        case 'growth_strategy':
          return await this.handleGrowthStrategyQuery(userId, businessProfile);
        
        case 'financial_analysis':
          return await this.handleFinancialAnalysisQuery(userId);
        
        case 'marketing_advice':
          return await this.handleMarketingAdviceQuery(userId, businessProfile);
        
        case 'business_insights':
          return await this.handleBusinessInsightsQuery(userId);
        
        default:
          return {
            message: 'I can help you with various aspects of your business. What would you like to know about?',
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
    businessProfile?: BusinessProfile
  ): Promise<AIResponse> {
    const recommendations: string[] = [];
    const dataReferences: DataReference[] = [];
    let contextInfo = '';

    // Build context for AI
    if (businessProfile) {
      contextInfo = `Business: ${businessProfile.businessName}, Industry: ${businessProfile.industry}, Type: ${businessProfile.businessType}, Employees: ${businessProfile.employeeCount}`;
    }

    // Try to get actual financial data for more specific recommendations
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const expenseBreakdown = await FinanceService.getCategoryBreakdown(
        userId,
        'expense',
        { startDate, endDate }
      );
      
      if (expenseBreakdown && expenseBreakdown.length > 0) {
        const topExpenseCategory = expenseBreakdown[0];
        contextInfo += `\nTop expense category: ${topExpenseCategory.category} (₹${topExpenseCategory.total})`;
        
        dataReferences.push({
          type: 'metric',
          id: 'top-expense-category',
          value: topExpenseCategory,
        });
      }
    } catch (error) {
      // Continue without financial data
    }

    // Try to use Gemini for enhanced response
    const aiPrompt = `Provide 3-5 specific, actionable cost-cutting recommendations for a small business. Focus on practical strategies that can be implemented immediately.`;
    const aiResponse = await this.enhanceWithGemini(aiPrompt, contextInfo);

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
    businessProfile?: BusinessProfile
  ): Promise<AIResponse> {
    if (!businessProfile) {
      return {
        message: 'To provide personalized growth strategies, I need to know more about your business. Please complete your business profile first.',
        requiresClarification: false,
        suggestions: ['Set up my business profile'],
      };
    }

    const dataReferences: DataReference[] = [];
    const { industry, businessType, targetAudience, location } = businessProfile;

    // Build context for AI
    let contextInfo = `Business: ${businessProfile.businessName}, Industry: ${industry}, Type: ${businessType}, Target Audience: ${targetAudience}, Location: ${location}`;

    // Add data-driven insights if available
    try {
      const dashboardData = await DashboardService.getDashboardData(userId);
      
      if (dashboardData.keyMetrics.revenueChange !== undefined) {
        contextInfo += `\nRevenue trend: ${dashboardData.keyMetrics.revenueChange > 0 ? 'Growing' : 'Declining'} by ${Math.abs(dashboardData.keyMetrics.revenueChange).toFixed(1)}%`;
      }

      dataReferences.push({
        type: 'metric',
        id: 'revenue-trend',
        value: dashboardData.keyMetrics.revenueChange,
      });
    } catch (error) {
      // Continue without dashboard data
    }

    // Try to use Gemini for enhanced response
    const aiPrompt = `Provide 3-5 specific, actionable growth strategies for this small business. Focus on practical, cost-effective strategies that can help expand the customer base and increase revenue.`;
    const aiResponse = await this.enhanceWithGemini(aiPrompt, contextInfo);

    let message: string;
    
    if (aiResponse) {
      // Use AI-generated response
      message = aiResponse;
    } else {
      // Fall back to rule-based strategies
      const strategies: string[] = [];
      
      strategies.push(
        `Expand your customer base in ${location} through targeted local marketing campaigns`,
        `Leverage social media to reach more ${targetAudience} in your area`,
        `Develop partnerships with complementary businesses in the ${industry} sector`
      );

      if (industry === 'retail' || industry === 'food-beverage') {
        strategies.push(
          'Introduce new product lines based on customer demand and seasonal trends'
        );
      } else if (industry === 'services') {
        strategies.push(
          'Offer package deals or subscription services for recurring revenue'
        );
      }

      message = `Here are growth strategies tailored for your ${businessType} business:\n\n${strategies.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`;
    }

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
  private static async handleFinancialAnalysisQuery(userId: string): Promise<AIResponse> {
    try {
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
    businessProfile?: BusinessProfile
  ): Promise<AIResponse> {
    if (!businessProfile) {
      return {
        message: 'To provide personalized marketing advice, I need to know more about your business. Please complete your business profile first.',
        requiresClarification: false,
        suggestions: ['Set up my business profile'],
      };
    }

    try {
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
  private static async handleBusinessInsightsQuery(userId: string): Promise<AIResponse> {
    try {
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
