import * as fc from 'fast-check';
import { MarketingService } from './marketingService';
import { BusinessProfile } from '../types';

// Mock the cache utility to avoid Redis connection issues during testing
jest.mock('../utils/cache', () => ({
  CacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    getOrSet: jest.fn().mockImplementation(async (key: string, fetchFn: () => Promise<any>) => {
      return await fetchFn();
    }),
  },
  CacheKeys: {
    marketingStrategies: jest.fn().mockReturnValue('mock-cache-key'),
    contentSuggestions: jest.fn().mockReturnValue('mock-cache-key'),
    sentimentAnalysis: jest.fn().mockReturnValue('mock-cache-key'),
  },
  CacheTTL: {
    MARKETING_STRATEGIES: 3600,
    CONTENT_SUGGESTIONS: 3600,
    SENTIMENT_ANALYSIS: 7200,
  },
}));

// Custom arbitraries for generating test data
const arbitraryBusinessProfile = (): fc.Arbitrary<BusinessProfile> => {
  return fc.record({
    id: fc.uuid(),
    userId: fc.uuid(),
    businessName: fc.string({ minLength: 1, maxLength: 100 }),
    businessType: fc.constantFrom(
      'retail',
      'restaurant',
      'service',
      'manufacturing',
      'wholesale',
      'e-commerce',
      'consulting',
      'other'
    ),
    industry: fc.constantFrom(
      'food-beverage',
      'retail',
      'technology',
      'healthcare',
      'education',
      'construction',
      'agriculture',
      'textiles',
      'automotive',
      'hospitality',
      'professional-services',
      'other'
    ),
    location: fc.string({ minLength: 1, maxLength: 100 }),
    targetAudience: fc.string({ minLength: 1, maxLength: 200 }),
    monthlyRevenue: fc.option(fc.integer({ min: 1000, max: 10000000 }), { nil: undefined }),
    employeeCount: fc.integer({ min: 1, max: 500 }),
    establishedDate: fc.date({ max: new Date() }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });
};

// Custom arbitrary for customer feedback
const arbitraryCustomerFeedback = (): fc.Arbitrary<any> => {
  return fc.record({
    id: fc.uuid(),
    text: fc.string({ minLength: 5, maxLength: 500 }),
    language: fc.constantFrom('en', 'hi', 'ta', 'te', 'bn', 'mr'),
    source: fc.constantFrom('email', 'social', 'review', 'survey', 'manual'),
    date: fc.date(),
  });
};

describe('MarketingService', () => {
  describe('generateStrategies', () => {
    // Feature: msme-ai-assistant, Property 10: Marketing strategy completeness
    // Validates: Requirements 4.1, 4.4
    it('should return at least 3 strategies with complete structure', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBusinessProfile(), async (businessProfile) => {
          const strategies = await MarketingService.generateStrategies(businessProfile);

          // Should return at least 3 strategies
          expect(strategies.length).toBeGreaterThanOrEqual(3);

          // Each strategy should have complete structure
          strategies.forEach((strategy) => {
            expect(strategy).toHaveProperty('id');
            expect(strategy).toHaveProperty('title');
            expect(strategy).toHaveProperty('description');
            expect(strategy).toHaveProperty('estimatedCost');
            expect(strategy).toHaveProperty('actionSteps');

            // Verify non-empty values
            expect(strategy.id).toBeTruthy();
            expect(strategy.title).toBeTruthy();
            expect(strategy.description).toBeTruthy();
            expect(typeof strategy.estimatedCost).toBe('number');
            expect(Array.isArray(strategy.actionSteps)).toBe(true);
            expect(strategy.actionSteps.length).toBeGreaterThan(0);
          });
        }),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 11: Marketing strategy cost ordering
    // Validates: Requirements 4.2
    it('should return strategies ordered by cost (low to high)', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryBusinessProfile(), async (businessProfile) => {
          const strategies = await MarketingService.generateStrategies(businessProfile);

          // Check that strategies are ordered by cost
          for (let i = 0; i < strategies.length - 1; i++) {
            expect(strategies[i].estimatedCost).toBeLessThanOrEqual(
              strategies[i + 1].estimatedCost
            );
          }
        }),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 12: Budget constraint compliance
    // Validates: Requirements 4.3
    it('should return only strategies within budget when budget is specified', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryBusinessProfile(),
          fc.integer({ min: 0, max: 20000 }),
          async (businessProfile, budget) => {
            const strategies = await MarketingService.generateStrategies(
              businessProfile,
              budget
            );

            // All strategies should be within budget
            strategies.forEach((strategy) => {
              expect(strategy.estimatedCost).toBeLessThanOrEqual(budget);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 13: Recommendation context sensitivity
    // Validates: Requirements 4.5
    it('should generate different strategies for different business contexts', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryBusinessProfile(),
          arbitraryBusinessProfile(),
          async (profile1, profile2) => {
            // Ensure profiles are actually different in key attributes
            fc.pre(
              profile1.industry !== profile2.industry ||
                profile1.targetAudience !== profile2.targetAudience
            );

            const strategies1 = await MarketingService.generateStrategies(profile1);
            const strategies2 = await MarketingService.generateStrategies(profile2);

            // Convert strategies to comparable format (descriptions contain context)
            const descriptions1 = strategies1.map((s) => s.description).sort();
            const descriptions2 = strategies2.map((s) => s.description).sort();

            // Strategies should be different (at least some descriptions should differ)
            const allSame = descriptions1.every(
              (desc, idx) => desc === descriptions2[idx]
            );
            expect(allSame).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('suggestContent', () => {
    // Feature: msme-ai-assistant, Property 14: Content suggestion completeness
    // Validates: Requirements 5.1, 5.2, 5.5
    it('should return at least 5 suggestions with complete structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryBusinessProfile(),
          fc.option(fc.integer({ min: 5, max: 20 }), { nil: undefined }),
          async (businessProfile, count) => {
            const suggestions = await MarketingService.suggestContent(
              businessProfile,
              count
            );

            // Should return at least 5 suggestions
            expect(suggestions.length).toBeGreaterThanOrEqual(5);

            // Each suggestion should have complete structure
            suggestions.forEach((suggestion) => {
              expect(suggestion).toHaveProperty('id');
              expect(suggestion).toHaveProperty('title');
              expect(suggestion).toHaveProperty('platform');
              expect(suggestion).toHaveProperty('outline');
              expect(suggestion).toHaveProperty('estimatedEffort');
              expect(suggestion).toHaveProperty('potentialReach');

              // Verify non-empty values
              expect(suggestion.id).toBeTruthy();
              expect(suggestion.title).toBeTruthy();
              expect(['social', 'email', 'blog', 'sms']).toContain(suggestion.platform);
              expect(suggestion.outline).toBeTruthy();
              expect(['low', 'medium', 'high']).toContain(suggestion.estimatedEffort);
              expect(typeof suggestion.potentialReach).toBe('number');
              expect(suggestion.potentialReach).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 15: Content outline provision
    // Validates: Requirements 5.3
    it('should return non-empty outline for any valid content ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (contentId) => {
            const outline = await MarketingService.getContentOutline(contentId);

            // Outline should be non-empty
            expect(outline).toBeTruthy();
            expect(typeof outline).toBe('string');
            expect(outline.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('analyzeSentiment', () => {
    // Feature: msme-ai-assistant, Property 16: Sentiment classification validity
    // Validates: Requirements 6.1
    it('should classify sentiment as exactly one of positive, negative, or neutral', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(arbitraryCustomerFeedback(), { minLength: 1, maxLength: 50 }),
          async (feedback) => {
            const result = await MarketingService.analyzeSentiment(feedback);

            // Distribution percentages should sum to 100
            const sum = result.distribution.positive + result.distribution.neutral + result.distribution.negative;
            expect(sum).toBe(100);

            // Each category should be between 0 and 100
            expect(result.distribution.positive).toBeGreaterThanOrEqual(0);
            expect(result.distribution.positive).toBeLessThanOrEqual(100);
            expect(result.distribution.neutral).toBeGreaterThanOrEqual(0);
            expect(result.distribution.neutral).toBeLessThanOrEqual(100);
            expect(result.distribution.negative).toBeGreaterThanOrEqual(0);
            expect(result.distribution.negative).toBeLessThanOrEqual(100);

            // At least one category should have a non-zero value
            expect(
              result.distribution.positive > 0 ||
              result.distribution.neutral > 0 ||
              result.distribution.negative > 0
            ).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 17: Sentiment aggregation
    // Validates: Requirements 6.2
    it('should calculate overall sentiment score and distribution that sums to 100%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(arbitraryCustomerFeedback(), { minLength: 1, maxLength: 50 }),
          async (feedback) => {
            const result = await MarketingService.analyzeSentiment(feedback);

            // Overall score should be between 0 and 100
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.overallScore).toBeLessThanOrEqual(100);

            // Distribution should sum to exactly 100%
            const sum = result.distribution.positive + result.distribution.neutral + result.distribution.negative;
            expect(sum).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 18: Topic frequency identification
    // Validates: Requirements 6.4
    it('should identify and rank topics by frequency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(arbitraryCustomerFeedback(), { minLength: 1, maxLength: 50 }),
          async (feedback) => {
            const result = await MarketingService.analyzeSentiment(feedback);

            // Topics should be sorted by frequency (descending)
            for (let i = 0; i < result.keyTopics.length - 1; i++) {
              expect(result.keyTopics[i].frequency).toBeGreaterThanOrEqual(
                result.keyTopics[i + 1].frequency
              );
            }

            // Each topic should have valid properties
            result.keyTopics.forEach((topic) => {
              expect(topic.topic).toBeTruthy();
              expect(typeof topic.topic).toBe('string');
              expect(topic.frequency).toBeGreaterThan(0);
              expect(['positive', 'neutral', 'negative']).toContain(topic.sentiment);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
