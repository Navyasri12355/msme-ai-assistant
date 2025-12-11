import * as fc from 'fast-check';
import { ConversationalAIService } from './conversationalAIService';
import { BusinessProfile } from '../types';
import { pool } from '../config/database';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock the other services
jest.mock('./financeService');
jest.mock('./marketingService');
jest.mock('./dashboardService');

// Mock the Gemini API to avoid quota issues during testing
// The mock will return null to force the service to use rule-based responses
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockRejectedValue(new Error('Mocked API - using fallback'))
    })
  }))
}));

describe('ConversationalAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property Tests', () => {
    /**
     * Feature: msme-ai-assistant, Property 1: Cost-cutting recommendations completeness
     * Validates: Requirements 1.2
     * 
     * For any business data, when requesting cost-cutting strategies,
     * the response should contain at least three distinct recommendations.
     */
    it('should return at least 3 cost-cutting recommendations for any business data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            businessProfile: fc.option(
              fc.record({
                id: fc.uuid(),
                userId: fc.uuid(),
                businessName: fc.string({ minLength: 1, maxLength: 100 }),
                businessType: fc.constantFrom('retail', 'food-beverage', 'services', 'manufacturing'),
                industry: fc.constantFrom('retail', 'food-beverage', 'services', 'manufacturing', 'hospitality'),
                location: fc.string({ minLength: 1, maxLength: 100 }),
                targetAudience: fc.string({ minLength: 1, maxLength: 200 }),
                monthlyRevenue: fc.option(fc.double({ min: 0, max: 10000000 })),
                employeeCount: fc.integer({ min: 1, max: 100 }),
                establishedDate: fc.date({ max: new Date() }),
                createdAt: fc.date(),
                updatedAt: fc.date(),
              }) as fc.Arbitrary<BusinessProfile>,
              { nil: undefined }
            ),
          }),
          async ({ userId, businessProfile }) => {
            // Mock database responses
            (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

            // Test various cost-cutting related queries
            const costQueries = [
              'how can I reduce costs',
              'ways to cut expenses',
              'save money in my business',
              'reduce spending',
              'lower my budget',
            ];

            for (const query of costQueries) {
              const response = await ConversationalAIService.processQuery(
                userId,
                query,
                businessProfile ? { previousMessages: [], userBusinessProfile: businessProfile } : undefined
              );

              // Skip if query was detected as ambiguous or out of domain
              if (response.requiresClarification || response.message.includes('business profile')) {
                continue;
              }

              // Extract recommendations from the message
              // Recommendations are numbered as "1. ", "2. ", "3. ", etc.
              const recommendationMatches = response.message.match(/\d+\.\s+[^\n]+/g);
              
              // Should have at least 3 recommendations
              expect(recommendationMatches).not.toBeNull();
              expect(recommendationMatches).toBeDefined();
              if (recommendationMatches) {
                expect(recommendationMatches.length).toBeGreaterThanOrEqual(3);

                // Verify recommendations are distinct (no duplicates)
                const recommendations = recommendationMatches.map(r => r.trim());
                const uniqueRecommendations = new Set(recommendations);
                expect(uniqueRecommendations.size).toBe(recommendations.length);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: msme-ai-assistant, Property 2: Growth strategy contextualization
     * Validates: Requirements 1.3
     * 
     * For any business profile with specified industry and metrics,
     * when requesting growth strategies, the response should reference
     * the provided industry and at least one metric from the profile.
     */
    it('should contextualize growth strategies with industry and profile metrics', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            businessProfile: fc.record({
              id: fc.uuid(),
              userId: fc.uuid(),
              businessName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
              businessType: fc.constantFrom('retail', 'food-beverage', 'services', 'manufacturing'),
              industry: fc.constantFrom('retail', 'food-beverage', 'services', 'manufacturing', 'hospitality'),
              location: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
              targetAudience: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
              monthlyRevenue: fc.option(fc.double({ min: 0, max: 10000000 })),
              employeeCount: fc.integer({ min: 1, max: 100 }),
              establishedDate: fc.date({ max: new Date() }),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }) as fc.Arbitrary<BusinessProfile>,
          }),
          async ({ userId, businessProfile }) => {
            // Mock database responses
            (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

            // Test various growth-related queries
            const growthQueries = [
              'how can I grow my business',
              'strategies to increase revenue',
              'expand my customer base',
              'scale my business',
              'grow sales',
            ];

            for (const query of growthQueries) {
              const response = await ConversationalAIService.processQuery(
                userId,
                query,
                { previousMessages: [], userBusinessProfile: businessProfile }
              );

              // Skip if query was detected as ambiguous
              if (response.requiresClarification) {
                continue;
              }

              const message = response.message.toLowerCase();

              // Verify industry is referenced
              expect(message).toContain(businessProfile.industry.toLowerCase());

              // Verify at least one profile attribute is referenced
              const profileAttributes = [
                businessProfile.businessType.toLowerCase(),
                businessProfile.location.trim().toLowerCase(),
                businessProfile.targetAudience.trim().toLowerCase(),
              ].filter(attr => attr.length > 0);

              const hasProfileReference = profileAttributes.some(attr => 
                message.includes(attr)
              );

              expect(hasProfileReference).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('processQuery', () => {
      it('should handle empty query', async () => {
        const response = await ConversationalAIService.processQuery('user-123', '');
        
        expect(response.requiresClarification).toBe(false);
        expect(response.message).toContain('didn\'t receive a question');
      });

      it('should handle query exceeding length limit', async () => {
        const longQuery = 'a'.repeat(501);
        const response = await ConversationalAIService.processQuery('user-123', longQuery);
        
        expect(response.requiresClarification).toBe(false);
        expect(response.message).toContain('quite long');
      });

      it('should detect out-of-domain queries', async () => {
        const response = await ConversationalAIService.processQuery(
          'user-123',
          'what is the weather today'
        );
        
        expect(response.requiresClarification).toBe(false);
        expect(response.message).toContain('business-related');
        expect(response.suggestions).toBeDefined();
        expect(response.suggestions!.length).toBeGreaterThan(0);
      });

      it('should detect ambiguous queries and request clarification', async () => {
        const response = await ConversationalAIService.processQuery(
          'user-123',
          'cost help'
        );
        
        expect(response.requiresClarification).toBe(true);
        expect(response.clarificationQuestions).toBeDefined();
        expect(response.clarificationQuestions!.length).toBeGreaterThan(0);
      });

      it('should handle cost-cutting queries', async () => {
        (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

        const response = await ConversationalAIService.processQuery(
          'user-123',
          'how can I reduce my business costs'
        );
        
        expect(response.requiresClarification).toBe(false);
        expect(response.message).toBeTruthy();
        expect(response.message.length).toBeGreaterThan(0);
      });

      it('should handle growth strategy queries with business profile', async () => {
        (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

        const businessProfile: BusinessProfile = {
          id: 'profile-123',
          userId: 'user-123',
          businessName: 'Test Shop',
          businessType: 'retail',
          industry: 'retail',
          location: 'Mumbai',
          targetAudience: 'young professionals',
          employeeCount: 5,
          establishedDate: new Date('2020-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const response = await ConversationalAIService.processQuery(
          'user-123',
          'how can I grow my business',
          { previousMessages: [], userBusinessProfile: businessProfile }
        );
        
        expect(response.requiresClarification).toBe(false);
        expect(response.message).toContain('retail');
        expect(response.message).toContain('Mumbai');
      });

      it('should handle growth strategy queries without business profile', async () => {
        const response = await ConversationalAIService.processQuery(
          'user-123',
          'how can I grow my business'
        );
        
        expect(response.requiresClarification).toBe(false);
        expect(response.message).toContain('business profile');
      });
    });

    describe('getConversationHistory', () => {
      it('should return conversation history', async () => {
        const history = await ConversationalAIService.getConversationHistory('user-123', 10);
        
        expect(Array.isArray(history)).toBe(true);
      });
    });

    describe('clearContext', () => {
      it('should clear conversation context', async () => {
        await expect(
          ConversationalAIService.clearContext('user-123')
        ).resolves.not.toThrow();
      });
    });
  });
});
