import Sentiment from 'sentiment';
import crypto from 'crypto';
import {
  BusinessProfile,
  MarketingStrategy,
  ContentSuggestion,
  CustomerFeedback,
  SentimentAnalysis,
  TopicSentiment,
  Issue,
  LanguageSentiment,
} from '../types';
import { CacheService, CacheKeys, CacheTTL } from '../utils/cache';

/**
 * Marketing Advisor Service
 * Generates marketing strategies tailored to business context
 */
export class MarketingService {
  /**
   * Generate marketing strategies based on business profile and budget
   */
  static async generateStrategies(
    businessProfile: BusinessProfile,
    budget?: number
  ): Promise<MarketingStrategy[]> {
    const cacheKey = CacheKeys.marketingStrategies(businessProfile.userId || 'unknown', budget);

    return CacheService.getOrSet(
      cacheKey,
      CacheTTL.MARKETING_STRATEGIES,
      async () => {
        const strategies: MarketingStrategy[] = [];

        // Strategy templates based on business context
        const strategyTemplates = this.getStrategyTemplates(businessProfile);

        // Filter by budget if specified (including budget of 0)
        const filteredStrategies = budget !== undefined
          ? strategyTemplates.filter(s => s.estimatedCost <= budget)
          : strategyTemplates;

        // Sort by cost (low to high) - prioritize low-cost options
        filteredStrategies.sort((a, b) => a.estimatedCost - b.estimatedCost);

        // Return strategies with unique IDs
        return filteredStrategies.map((strategy, index) => ({
          ...strategy,
          id: `strategy-${Date.now()}-${index}`,
        }));
      }
    );
  }

  /**
   * Get strategy templates based on business context
   */
  private static getStrategyTemplates(
    businessProfile: BusinessProfile
  ): Omit<MarketingStrategy, 'id'>[] {
    const { industry, businessType, targetAudience, location } = businessProfile;

    const strategies: Omit<MarketingStrategy, 'id'>[] = [];

    // Social Media Strategy (Low Cost)
    strategies.push({
      title: 'Social Media Presence',
      description: `Build a strong social media presence on platforms popular with ${targetAudience}. Focus on consistent posting and engagement.`,
      estimatedCost: 0,
      expectedReach: 500,
      difficulty: 'low',
      actionSteps: [
        `Create business profiles on Facebook, Instagram, and WhatsApp Business`,
        `Post daily content showcasing your ${businessType} offerings`,
        `Engage with customer comments and messages within 2 hours`,
        `Use local hashtags related to ${location} and ${industry}`,
        `Share customer testimonials and success stories`,
      ],
      timeline: '2-4 weeks to establish presence',
    });

    // Google My Business (Free)
    strategies.push({
      title: 'Google My Business Optimization',
      description: `Claim and optimize your Google My Business listing to appear in local searches for ${industry} businesses in ${location}.`,
      estimatedCost: 0,
      expectedReach: 300,
      difficulty: 'low',
      actionSteps: [
        'Claim your Google My Business listing',
        'Add complete business information, hours, and photos',
        'Encourage satisfied customers to leave reviews',
        'Post weekly updates about offers and new products',
        'Respond to all customer reviews promptly',
      ],
      timeline: '1-2 weeks to set up',
    });

    // WhatsApp Marketing (Low Cost)
    strategies.push({
      title: 'WhatsApp Business Marketing',
      description: `Use WhatsApp Business to directly reach ${targetAudience} with personalized offers and updates.`,
      estimatedCost: 500,
      expectedReach: 200,
      difficulty: 'low',
      actionSteps: [
        'Set up WhatsApp Business account with catalog',
        'Collect customer phone numbers with permission',
        'Send weekly offers and product updates',
        'Create broadcast lists for different customer segments',
        'Use status updates to showcase daily specials',
      ],
      timeline: '1 week to launch',
    });

    // Local Partnerships (Low Cost)
    strategies.push({
      title: 'Local Business Partnerships',
      description: `Partner with complementary businesses in ${location} to cross-promote and expand reach.`,
      estimatedCost: 1000,
      expectedReach: 400,
      difficulty: 'medium',
      actionSteps: [
        `Identify 5-10 complementary businesses in ${location}`,
        'Propose mutual promotion arrangements',
        'Create joint offers or bundled services',
        'Share each other\'s content on social media',
        'Host collaborative events or promotions',
      ],
      timeline: '3-4 weeks to establish partnerships',
    });

    // Content Marketing (Low Cost)
    if (industry === 'food-beverage' || industry === 'retail' || industry === 'hospitality') {
      strategies.push({
        title: 'Visual Content Marketing',
        description: `Create engaging visual content showcasing your ${businessType} to attract ${targetAudience}.`,
        estimatedCost: 2000,
        expectedReach: 800,
        difficulty: 'medium',
        actionSteps: [
          'Take high-quality photos of products/services',
          'Create short video content (reels/shorts)',
          'Share behind-the-scenes content',
          'Post customer experience stories',
          'Run simple photo contests with customers',
        ],
        timeline: '2-3 weeks to build content library',
      });
    }

    // Email/SMS Marketing (Medium Cost)
    strategies.push({
      title: 'Customer Database Marketing',
      description: `Build and leverage a customer database for targeted SMS and email campaigns.`,
      estimatedCost: 3000,
      expectedReach: 600,
      difficulty: 'medium',
      actionSteps: [
        'Collect customer contact information at point of sale',
        'Segment customers by purchase history and preferences',
        'Send personalized offers on birthdays and anniversaries',
        'Create loyalty program with exclusive SMS/email offers',
        'Send monthly newsletters with tips and promotions',
      ],
      timeline: '4-6 weeks to build database',
    });

    // Local Events (Medium Cost)
    strategies.push({
      title: 'Community Events and Sponsorships',
      description: `Increase visibility in ${location} through local event participation and sponsorships.`,
      estimatedCost: 5000,
      expectedReach: 1000,
      difficulty: 'medium',
      actionSteps: [
        `Identify local events in ${location} relevant to ${targetAudience}`,
        'Sponsor community events or sports teams',
        'Set up stalls at local markets or fairs',
        'Host in-store events or workshops',
        'Distribute branded materials at events',
      ],
      timeline: '6-8 weeks to plan and execute',
    });

    // Referral Program (Medium Cost)
    strategies.push({
      title: 'Customer Referral Program',
      description: `Incentivize existing customers to refer new customers through a structured referral program.`,
      estimatedCost: 4000,
      expectedReach: 500,
      difficulty: 'medium',
      actionSteps: [
        'Design referral incentive structure (discounts, rewards)',
        'Create simple referral tracking system',
        'Promote referral program to existing customers',
        'Provide referral cards or digital codes',
        'Reward both referrer and new customer',
      ],
      timeline: '3-4 weeks to launch',
    });

    // Paid Social Media Ads (Higher Cost)
    strategies.push({
      title: 'Targeted Social Media Advertising',
      description: `Run targeted ads on Facebook and Instagram to reach ${targetAudience} in ${location}.`,
      estimatedCost: 8000,
      expectedReach: 2000,
      difficulty: 'high',
      actionSteps: [
        'Define target audience demographics and interests',
        'Create compelling ad creatives and copy',
        'Set up Facebook Ads Manager account',
        'Start with small daily budget (₹200-500)',
        'Monitor performance and optimize based on results',
      ],
      timeline: '2-3 weeks to set up and test',
    });

    // Influencer Partnerships (Higher Cost)
    if (industry === 'food-beverage' || industry === 'retail' || industry === 'hospitality') {
      strategies.push({
        title: 'Local Influencer Collaborations',
        description: `Partner with local micro-influencers to promote your ${businessType} to their followers.`,
        estimatedCost: 10000,
        expectedReach: 3000,
        difficulty: 'high',
        actionSteps: [
          `Identify local influencers followed by ${targetAudience}`,
          'Reach out with collaboration proposals',
          'Offer free products/services in exchange for posts',
          'Create unique discount codes for influencer followers',
          'Track results and build long-term relationships',
        ],
        timeline: '4-6 weeks to establish collaborations',
      });
    }

    return strategies;
  }

  /**
   * Generate content suggestions based on business profile
   */
  static async suggestContent(
    businessProfile: BusinessProfile,
    count: number = 5
  ): Promise<ContentSuggestion[]> {
    const cacheKey = CacheKeys.contentSuggestions(businessProfile.userId || 'unknown', count);

    return CacheService.getOrSet(
      cacheKey,
      CacheTTL.CONTENT_SUGGESTIONS,
      async () => {
        const suggestions: ContentSuggestion[] = [];

        // Get content templates based on business context
        const contentTemplates = this.getContentTemplates(businessProfile);

        // Return requested number of suggestions (minimum 5)
        const numSuggestions = Math.max(count, 5);
        const selectedTemplates = contentTemplates.slice(0, numSuggestions);

        // Return suggestions with unique IDs
        return selectedTemplates.map((template, index) => ({
          ...template,
          id: `content-${Date.now()}-${index}`,
        }));
      }
    );
  }

  /**
   * Get detailed outline for a content suggestion
   */
  static async getContentOutline(contentId: string): Promise<string> {
    // In a real implementation, this would fetch from a database
    // For now, return a generic outline
    return `Detailed outline for content ${contentId}:\n\n1. Introduction\n2. Main content points\n3. Call to action\n4. Engagement prompts`;
  }

  /**
   * Get content templates based on business context
   */
  private static getContentTemplates(
    businessProfile: BusinessProfile
  ): Omit<ContentSuggestion, 'id'>[] {
    const { industry, businessType, targetAudience, location } = businessProfile;
    const templates: Omit<ContentSuggestion, 'id'>[] = [];

    // Get current month for seasonal content
    const currentMonth = new Date().getMonth();
    const seasonalContext = this.getSeasonalContext(currentMonth);

    // Social Media Content - Product Showcase
    templates.push({
      title: `Showcase Your ${businessType} Offerings`,
      platform: 'social',
      contentType: 'Product Highlight Post',
      outline: `Create a visually appealing post featuring your best-selling products or services.\n\nStructure:\n- Eye-catching image or video\n- Brief description highlighting unique features\n- Price and availability information\n- Call-to-action (Visit us, Order now, etc.)\n- Relevant hashtags: #${location} #${industry} #${businessType}`,
      estimatedEffort: 'low',
      potentialReach: 300,
      relevance: `Perfect for attracting ${targetAudience} in ${location}`,
    });

    // Social Media Content - Customer Testimonial
    templates.push({
      title: 'Share Customer Success Stories',
      platform: 'social',
      contentType: 'Customer Testimonial',
      outline: `Feature a satisfied customer's experience with your business.\n\nStructure:\n- Customer photo (with permission) or quote graphic\n- Their testimonial in their own words\n- What problem you solved for them\n- Thank you message\n- Encourage others to share their experiences`,
      estimatedEffort: 'low',
      potentialReach: 250,
      relevance: `Builds trust with ${targetAudience} through social proof`,
    });

    // Social Media Content - Behind the Scenes
    templates.push({
      title: 'Behind-the-Scenes Content',
      platform: 'social',
      contentType: 'Behind-the-Scenes Story',
      outline: `Show the human side of your business with behind-the-scenes content.\n\nStructure:\n- Photos or short videos of your workspace\n- Introduce team members\n- Show your process or preparation\n- Share your business values\n- Use Instagram Stories or Reels format`,
      estimatedEffort: 'low',
      potentialReach: 400,
      relevance: `Humanizes your brand and connects with ${targetAudience}`,
    });

    // Seasonal Content
    templates.push({
      title: `${seasonalContext.name} Special Promotion`,
      platform: 'social',
      contentType: 'Seasonal Campaign',
      outline: `Create a ${seasonalContext.name}-themed promotion to drive sales.\n\nStructure:\n- ${seasonalContext.name}-themed visuals\n- Special discount or offer (e.g., "Festival Special: 20% off")\n- Limited-time urgency ("Valid until...")\n- ${seasonalContext.description}\n- Multiple posts leading up to the event`,
      estimatedEffort: 'medium',
      potentialReach: 600,
      relevance: seasonalContext.relevance,
    });

    // Email/SMS Content - Weekly Newsletter
    templates.push({
      title: 'Weekly Customer Newsletter',
      platform: 'email',
      contentType: 'Newsletter',
      outline: `Send a weekly update to your customer database.\n\nStructure:\n- Greeting with customer's name\n- This week's featured products/services\n- Special offer for email subscribers\n- Helpful tip related to ${industry}\n- Upcoming events or announcements\n- Clear call-to-action button`,
      estimatedEffort: 'medium',
      potentialReach: 200,
      relevance: `Keeps your ${targetAudience} engaged and informed`,
    });

    // SMS Content - Flash Sale
    templates.push({
      title: 'Flash Sale SMS Alert',
      platform: 'sms',
      contentType: 'Promotional SMS',
      outline: `Send a time-sensitive offer via SMS to drive immediate action.\n\nStructure:\n- Brief greeting\n- Clear offer (e.g., "Flash Sale: 30% off today only!")\n- Urgency indicator (time limit)\n- Simple redemption instructions\n- Opt-out option\n- Keep under 160 characters`,
      estimatedEffort: 'low',
      potentialReach: 150,
      relevance: `Direct reach to ${targetAudience} with high open rates`,
    });

    // Blog Content - How-to Guide
    if (industry === 'food-beverage' || industry === 'retail' || industry === 'services') {
      templates.push({
        title: `How-to Guide Related to ${industry}`,
        platform: 'blog',
        contentType: 'Educational Blog Post',
        outline: `Write a helpful guide that positions you as an expert.\n\nStructure:\n- Catchy title addressing a common problem\n- Introduction explaining why this matters\n- Step-by-step instructions with images\n- Pro tips from your experience\n- Conclusion with call-to-action\n- Share on social media and via email`,
        estimatedEffort: 'high',
        potentialReach: 500,
        relevance: `Establishes authority and attracts ${targetAudience} searching for solutions`,
      });
    }

    // Social Media Content - User-Generated Content Campaign
    templates.push({
      title: 'Customer Photo Contest',
      platform: 'social',
      contentType: 'User-Generated Content Campaign',
      outline: `Encourage customers to share photos with your products/services.\n\nStructure:\n- Announce the contest with clear rules\n- Create a unique hashtag (e.g., #My${businessType}Experience)\n- Offer a prize (discount, free product, feature on your page)\n- Repost customer submissions (with credit)\n- Announce winner and thank participants\n- Run for 2-4 weeks`,
      estimatedEffort: 'medium',
      potentialReach: 800,
      relevance: `Generates authentic content and engages ${targetAudience}`,
    });

    // Social Media Content - Tips and Tricks
    templates.push({
      title: `${industry} Tips for ${targetAudience}`,
      platform: 'social',
      contentType: 'Educational Carousel Post',
      outline: `Share valuable tips related to your industry.\n\nStructure:\n- Create 5-7 slide carousel\n- Each slide with one tip\n- Use consistent branding and colors\n- Mix of text and visuals\n- Last slide: Call-to-action (Follow for more tips)\n- Post during peak engagement hours`,
      estimatedEffort: 'medium',
      potentialReach: 450,
      relevance: `Provides value to ${targetAudience} while showcasing expertise`,
    });

    // Email Content - Birthday/Anniversary
    templates.push({
      title: 'Personalized Birthday Offers',
      platform: 'email',
      contentType: 'Personalized Email',
      outline: `Send special offers to customers on their birthday or business anniversary.\n\nStructure:\n- Personalized greeting with customer name\n- Birthday wishes\n- Exclusive birthday discount or gift\n- Valid for limited time (e.g., birthday month)\n- Easy redemption process\n- Warm, personal tone`,
      estimatedEffort: 'low',
      potentialReach: 100,
      relevance: `Personal touch that drives loyalty among ${targetAudience}`,
    });

    // Social Media Content - Local Community Focus
    templates.push({
      title: `Celebrate ${location} Community`,
      platform: 'social',
      contentType: 'Community Engagement Post',
      outline: `Highlight your connection to the local community.\n\nStructure:\n- Feature local landmarks or events\n- Share your involvement in community activities\n- Spotlight other local businesses (non-competitors)\n- Use local language or phrases\n- Tag local community pages\n- Encourage community pride`,
      estimatedEffort: 'low',
      potentialReach: 350,
      relevance: `Strengthens local presence and resonates with ${targetAudience} in ${location}`,
    });

    // Trending Topic Content
    const trendingTopic = this.getTrendingTopic(industry, currentMonth);
    templates.push({
      title: `${trendingTopic.name} Trend Post`,
      platform: 'social',
      contentType: 'Trending Topic',
      outline: `Create content around current trending topics.\n\nStructure:\n- ${trendingTopic.description}\n- Connect the trend to your business\n- Use trending hashtags\n- Add your unique perspective\n- Encourage discussion in comments\n- Post when trend is at peak`,
      estimatedEffort: 'low',
      potentialReach: 700,
      relevance: trendingTopic.relevance,
    });

    return templates;
  }

  /**
   * Get seasonal context based on current month
   */
  private static getSeasonalContext(month: number): {
    name: string;
    description: string;
    relevance: string;
  } {
    // Indian festivals and seasons
    const seasonalMap: Record<number, { name: string; description: string; relevance: string }> = {
      0: {
        name: 'New Year',
        description: 'New Year celebrations and fresh start promotions',
        relevance: 'Capitalize on New Year shopping and resolution-related purchases',
      },
      1: {
        name: 'Republic Day',
        description: 'Republic Day patriotic themes and sales',
        relevance: 'Connect with national pride and offer special discounts',
      },
      2: {
        name: 'Holi',
        description: 'Festival of colors celebrations',
        relevance: 'Vibrant, colorful promotions for the festive season',
      },
      3: {
        name: 'Spring Season',
        description: 'Spring season refresh and renewal themes',
        relevance: 'Fresh starts and seasonal product promotions',
      },
      4: {
        name: 'Summer Sale',
        description: 'Summer season special offers',
        relevance: 'Beat the heat with summer-specific products and services',
      },
      5: {
        name: 'Monsoon',
        description: 'Monsoon season preparations',
        relevance: 'Rainy season products and cozy indoor experiences',
      },
      6: {
        name: 'Monsoon',
        description: 'Monsoon season continues',
        relevance: 'Rainy season products and cozy indoor experiences',
      },
      7: {
        name: 'Independence Day',
        description: 'Independence Day patriotic celebrations',
        relevance: 'National pride and freedom sale promotions',
      },
      8: {
        name: 'Ganesh Chaturthi',
        description: 'Ganesh Chaturthi festival celebrations',
        relevance: 'Major festival shopping and celebration themes',
      },
      9: {
        name: 'Navratri & Dussehra',
        description: 'Navratri and Dussehra festival season',
        relevance: 'Major festival season with high shopping activity',
      },
      10: {
        name: 'Diwali',
        description: 'Diwali - Festival of Lights celebrations',
        relevance: 'Biggest shopping season of the year in India',
      },
      11: {
        name: 'Year-End Sale',
        description: 'Year-end clearance and holiday season',
        relevance: 'Clear inventory and prepare for new year',
      },
    };

    return seasonalMap[month];
  }

  /**
   * Get trending topic based on industry and season
   */
  private static getTrendingTopic(industry: string, month: number): {
    name: string;
    description: string;
    relevance: string;
  } {
    // Generic trending topics that can be adapted
    const topics = [
      {
        name: 'Sustainability',
        description: 'Share how your business is eco-friendly or sustainable',
        relevance: 'Growing consumer interest in sustainable businesses',
      },
      {
        name: 'Digital Transformation',
        description: 'Showcase how you\'re embracing digital tools',
        relevance: 'Demonstrates innovation and modern approach',
      },
      {
        name: 'Local First',
        description: 'Emphasize supporting local businesses',
        relevance: 'Strong movement supporting local economy',
      },
      {
        name: 'Health & Wellness',
        description: 'Connect your offerings to health and wellness',
        relevance: 'Increased focus on health post-pandemic',
      },
    ];

    // Return a topic based on month to add variety
    return topics[month % topics.length];
  }

  /**
   * Analyze customer sentiment from feedback
   */
  static async analyzeSentiment(feedback: CustomerFeedback[]): Promise<SentimentAnalysis> {
    if (!feedback || feedback.length === 0) {
      return {
        overallScore: 0,
        distribution: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
        keyTopics: [],
        negativeIssues: [],
        languageBreakdown: [],
      };
    }

    // Create a hash of the feedback to use as cache key
    const feedbackHash = this.hashFeedback(feedback);
    const cacheKey = CacheKeys.sentimentAnalysis(feedbackHash);

    return CacheService.getOrSet(
      cacheKey,
      CacheTTL.SENTIMENT_ANALYSIS,
      async () => this.analyzeSentimentInternal(feedback)
    );
  }

  /**
   * Create a hash of feedback for caching
   */
  private static hashFeedback(feedback: CustomerFeedback[]): string {
    const feedbackString = feedback
      .map(f => f.text)
      .sort()
      .join('|');
    return crypto.createHash('md5').update(feedbackString).digest('hex');
  }

  /**
   * Internal method to analyze sentiment (without caching)
   */
  private static async analyzeSentimentInternal(feedback: CustomerFeedback[]): Promise<SentimentAnalysis> {

    const sentiment = new Sentiment();
    const sentimentResults: Array<{
      score: number;
      comparative: number;
      classification: 'positive' | 'neutral' | 'negative';
      language: string;
      text: string;
    }> = [];

    // Analyze each feedback
    for (const item of feedback) {
      const result = sentiment.analyze(item.text);
      
      // Classify sentiment based on comparative score
      let classification: 'positive' | 'neutral' | 'negative';
      if (result.comparative > 0.1) {
        classification = 'positive';
      } else if (result.comparative < -0.1) {
        classification = 'negative';
      } else {
        classification = 'neutral';
      }

      sentimentResults.push({
        score: result.score,
        comparative: result.comparative,
        classification,
        language: item.language || 'en',
        text: item.text,
      });
    }

    // Calculate distribution
    const positiveCount = sentimentResults.filter((r) => r.classification === 'positive').length;
    const neutralCount = sentimentResults.filter((r) => r.classification === 'neutral').length;
    const negativeCount = sentimentResults.filter((r) => r.classification === 'negative').length;
    const total = sentimentResults.length;

    const distribution = {
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
    };

    // Adjust for rounding errors to ensure sum is 100%
    const sum = distribution.positive + distribution.neutral + distribution.negative;
    if (sum !== 100 && total > 0) {
      const diff = 100 - sum;
      // Add difference to the largest category
      if (distribution.positive >= distribution.neutral && distribution.positive >= distribution.negative) {
        distribution.positive += diff;
      } else if (distribution.neutral >= distribution.negative) {
        distribution.neutral += diff;
      } else {
        distribution.negative += diff;
      }
    }

    // Calculate overall score (average comparative score, normalized to 0-100)
    const avgComparative = sentimentResults.reduce((sum, r) => sum + r.comparative, 0) / total;
    const overallScore = Math.round(((avgComparative + 1) / 2) * 100); // Normalize from [-1, 1] to [0, 100]

    // Extract topics and their frequency
    const keyTopics = this.extractTopics(sentimentResults);

    // Identify negative issues
    const negativeIssues = this.extractNegativeIssues(
      sentimentResults.filter((r) => r.classification === 'negative')
    );

    // Calculate language breakdown
    const languageBreakdown = this.calculateLanguageBreakdown(sentimentResults);

    return {
      overallScore,
      distribution,
      keyTopics,
      negativeIssues,
      languageBreakdown,
    };
  }

  /**
   * Extract topics from feedback text
   */
  private static extractTopics(
    sentimentResults: Array<{
      score: number;
      comparative: number;
      classification: 'positive' | 'neutral' | 'negative';
      language: string;
      text: string;
    }>
  ): TopicSentiment[] {
    // Common words to exclude (stop words)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
      'its', 'our', 'their', 'me', 'him', 'us', 'them', 'very', 'too', 'so',
    ]);

    // Extract words from all feedback
    const wordFrequency = new Map<string, { count: number; sentiments: string[] }>();

    sentimentResults.forEach((result) => {
      const words = result.text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word));

      words.forEach((word) => {
        if (!wordFrequency.has(word)) {
          wordFrequency.set(word, { count: 0, sentiments: [] });
        }
        const entry = wordFrequency.get(word)!;
        entry.count++;
        entry.sentiments.push(result.classification);
      });
    });

    // Convert to array and sort by frequency
    const topics: TopicSentiment[] = Array.from(wordFrequency.entries())
      .map(([word, data]) => {
        // Determine dominant sentiment for this topic
        const sentimentCounts = {
          positive: data.sentiments.filter((s) => s === 'positive').length,
          neutral: data.sentiments.filter((s) => s === 'neutral').length,
          negative: data.sentiments.filter((s) => s === 'negative').length,
        };

        let dominantSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (sentimentCounts.positive > sentimentCounts.neutral && sentimentCounts.positive > sentimentCounts.negative) {
          dominantSentiment = 'positive';
        } else if (sentimentCounts.negative > sentimentCounts.neutral) {
          dominantSentiment = 'negative';
        }

        return {
          topic: word,
          frequency: data.count,
          sentiment: dominantSentiment,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 topics

    return topics;
  }

  /**
   * Extract negative issues from negative feedback
   */
  private static extractNegativeIssues(
    negativeFeedback: Array<{
      score: number;
      comparative: number;
      classification: 'positive' | 'neutral' | 'negative';
      language: string;
      text: string;
    }>
  ): Issue[] {
    if (negativeFeedback.length === 0) {
      return [];
    }

    // Common negative keywords and their categories
    const issueKeywords = {
      quality: ['poor', 'bad', 'terrible', 'awful', 'worst', 'defective', 'broken', 'damaged'],
      service: ['rude', 'slow', 'unprofessional', 'unhelpful', 'ignored', 'waiting', 'delay'],
      price: ['expensive', 'overpriced', 'costly', 'pricey', 'waste', 'money'],
      cleanliness: ['dirty', 'unclean', 'messy', 'filthy', 'unhygienic'],
      availability: ['unavailable', 'out of stock', 'closed', 'missing'],
    };

    const issueFrequency = new Map<string, number>();

    negativeFeedback.forEach((feedback) => {
      const text = feedback.text.toLowerCase();
      
      Object.entries(issueKeywords).forEach(([category, keywords]) => {
        keywords.forEach((keyword) => {
          if (text.includes(keyword)) {
            issueFrequency.set(category, (issueFrequency.get(category) || 0) + 1);
          }
        });
      });
    });

    // Convert to issues array
    const issues: Issue[] = Array.from(issueFrequency.entries())
      .map(([category, frequency]) => {
        // Determine severity based on frequency
        let severity: 'low' | 'medium' | 'high' = 'low';
        const percentage = (frequency / negativeFeedback.length) * 100;
        if (percentage > 50) {
          severity = 'high';
        } else if (percentage > 25) {
          severity = 'medium';
        }

        return {
          description: `Issues related to ${category}`,
          frequency,
          severity,
        };
      })
      .sort((a, b) => b.frequency - a.frequency);

    return issues;
  }

  /**
   * Calculate language breakdown
   */
  private static calculateLanguageBreakdown(
    sentimentResults: Array<{
      score: number;
      comparative: number;
      classification: 'positive' | 'neutral' | 'negative';
      language: string;
      text: string;
    }>
  ): LanguageSentiment[] {
    const languageMap = new Map<string, { count: number; totalComparative: number }>();

    sentimentResults.forEach((result) => {
      if (!languageMap.has(result.language)) {
        languageMap.set(result.language, { count: 0, totalComparative: 0 });
      }
      const entry = languageMap.get(result.language)!;
      entry.count++;
      entry.totalComparative += result.comparative;
    });

    return Array.from(languageMap.entries())
      .map(([language, data]) => ({
        language,
        count: data.count,
        averageSentiment: Math.round(((data.totalComparative / data.count + 1) / 2) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }
}
