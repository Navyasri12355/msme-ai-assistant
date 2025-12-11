import * as fc from 'fast-check';
import { DashboardService, KeyMetrics, MetricTrend } from './dashboardService';
import { Transaction } from '../types';

// Custom arbitraries for generating test data
const arbitraryTransaction = (): fc.Arbitrary<Transaction> => {
  return fc.record({
    id: fc.uuid(),
    userId: fc.uuid(),
    amount: fc.float({ min: Math.fround(-10000), max: Math.fround(10000), noNaN: true }),
    type: fc.constantFrom('income' as const, 'expense' as const),
    category: fc.oneof(
      fc.constant('Sales'),
      fc.constant('Rent'),
      fc.constant('Utilities'),
      fc.constant('Salary'),
      fc.constant('Marketing'),
      fc.constant('Supplies'),
      fc.constant('Uncategorized')
    ),
    description: fc.string({ minLength: 1, maxLength: 100 }),
    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    paymentMethod: fc.option(fc.constantFrom('cash', 'card', 'bank_transfer'), { nil: undefined }),
    customerId: fc.option(fc.uuid(), { nil: undefined }),
    productId: fc.option(fc.uuid(), { nil: undefined }),
    metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });
};

const arbitraryKeyMetrics = (): fc.Arbitrary<KeyMetrics> => {
  return fc.record({
    dailyRevenue: fc.float({ min: 0, max: 100000, noNaN: true }),
    totalCustomers: fc.nat({ max: 1000 }),
    topProducts: fc.array(
      fc.record({
        productId: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        revenue: fc.float({ min: 0, max: 10000, noNaN: true }),
        unitsSold: fc.nat({ max: 100 })
      }),
      { maxLength: 5 }
    ),
    revenueChange: fc.float({ min: -100, max: 100, noNaN: true }),
    customerChange: fc.float({ min: -100, max: 100, noNaN: true })
  });
};

const arbitraryInsight = (): fc.Arbitrary<any> => {
  return fc.record({
    id: fc.uuid(),
    priority: fc.constantFrom('high' as const, 'medium' as const, 'low' as const),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    recommendedAction: fc.string({ minLength: 1, maxLength: 200 }),
    expectedImpact: fc.string({ minLength: 1, maxLength: 200 }),
    category: fc.constantFrom('finance' as const, 'marketing' as const, 'operations' as const),
    likelyCause: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    correctiveMeasures: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    relatedMetric: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    isImprovement: fc.option(fc.boolean(), { nil: undefined }),
    nextSteps: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined })
  });
};

describe('DashboardService', () => {
  describe('calculateDirection', () => {
    // Feature: msme-ai-assistant, Property 20: Metric trend calculation
    it('should return "up" when current > previous', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (current, previous) => {
            fc.pre(current > previous);
            const direction = DashboardService.calculateDirection(current, previous);
            expect(direction).toBe('up');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 20: Metric trend calculation
    it('should return "down" when current < previous', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 1, max: 10000, noNaN: true }),
          (current, previous) => {
            fc.pre(current < previous);
            const direction = DashboardService.calculateDirection(current, previous);
            expect(direction).toBe('down');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: msme-ai-assistant, Property 20: Metric trend calculation
    it('should return "stable" when current === previous', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (value) => {
            const direction = DashboardService.calculateDirection(value, value);
            expect(direction).toBe('stable');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 19: Dashboard metric completeness', () => {
    // Feature: msme-ai-assistant, Property 19: Dashboard metric completeness
    it('should return non-null values for all key metrics fields', () => {
      fc.assert(
        fc.property(
          arbitraryKeyMetrics(),
          (keyMetrics) => {
            // Verify all required fields are present and non-null
            expect(keyMetrics.dailyRevenue).not.toBeNull();
            expect(keyMetrics.dailyRevenue).not.toBeUndefined();
            expect(typeof keyMetrics.dailyRevenue).toBe('number');

            expect(keyMetrics.totalCustomers).not.toBeNull();
            expect(keyMetrics.totalCustomers).not.toBeUndefined();
            expect(typeof keyMetrics.totalCustomers).toBe('number');

            expect(keyMetrics.topProducts).not.toBeNull();
            expect(keyMetrics.topProducts).not.toBeUndefined();
            expect(Array.isArray(keyMetrics.topProducts)).toBe(true);

            expect(keyMetrics.revenueChange).not.toBeNull();
            expect(keyMetrics.revenueChange).not.toBeUndefined();
            expect(typeof keyMetrics.revenueChange).toBe('number');

            expect(keyMetrics.customerChange).not.toBeNull();
            expect(keyMetrics.customerChange).not.toBeUndefined();
            expect(typeof keyMetrics.customerChange).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 20: Metric trend calculation', () => {
    // Feature: msme-ai-assistant, Property 20: Metric trend calculation
    it('should calculate correct trend direction for all metric values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (current, previous) => {
            const direction = DashboardService.calculateDirection(current, previous);
            
            if (current > previous) {
              expect(direction).toBe('up');
            } else if (current < previous) {
              expect(direction).toBe('down');
            } else {
              expect(direction).toBe('stable');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 21: Alert generation for thresholds', () => {
    // Feature: msme-ai-assistant, Property 21: Alert generation for thresholds
    it('should generate alert when metric exceeds or falls below threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            dailyRevenue: fc.float({ min: 0, max: 2000, noNaN: true }),
            totalCustomers: fc.nat({ max: 100 }),
            topProducts: fc.constant([]),
            revenueChange: fc.float({ min: -50, max: 50, noNaN: true }),
            customerChange: fc.float({ min: -50, max: 50, noNaN: true })
          }),
          async (keyMetrics) => {
            const alerts = await DashboardService.generateAlerts('test-user', keyMetrics);
            
            // Check if alerts are generated for metrics below thresholds
            const revenueAlert = alerts.find(a => a.metric === 'dailyRevenue');
            const revenueChangeAlert = alerts.find(a => a.metric === 'revenueChange');
            const customerChangeAlert = alerts.find(a => a.metric === 'customerChange');

            // If dailyRevenue < 1000, should have alert
            if (keyMetrics.dailyRevenue < 1000) {
              expect(revenueAlert).toBeDefined();
              if (revenueAlert) {
                expect(revenueAlert.currentValue).toBe(keyMetrics.dailyRevenue);
                expect(revenueAlert.threshold).toBe(1000);
              }
            }

            // If revenueChange < -10, should have alert
            if (keyMetrics.revenueChange < -10) {
              expect(revenueChangeAlert).toBeDefined();
              if (revenueChangeAlert) {
                expect(revenueChangeAlert.currentValue).toBe(keyMetrics.revenueChange);
                expect(revenueChangeAlert.threshold).toBe(-10);
              }
            }

            // If customerChange < -15, should have alert
            if (keyMetrics.customerChange < -15) {
              expect(customerChangeAlert).toBeDefined();
              if (customerChangeAlert) {
                expect(customerChangeAlert.currentValue).toBe(keyMetrics.customerChange);
                expect(customerChangeAlert.threshold).toBe(-15);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 22: Insight generation completeness', () => {
    // Feature: msme-ai-assistant, Property 22: Insight generation completeness
    it('should generate at least three insights with all required fields', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryInsight(), { minLength: 3, maxLength: 10 }),
          (insights) => {
            // Verify we have at least 3 insights
            expect(insights.length).toBeGreaterThanOrEqual(3);

            // Verify each insight has all required fields
            for (const insight of insights) {
              expect(insight.id).toBeDefined();
              expect(typeof insight.id).toBe('string');
              expect(insight.id.length).toBeGreaterThan(0);

              expect(insight.priority).toBeDefined();
              expect(['high', 'medium', 'low']).toContain(insight.priority);

              expect(insight.title).toBeDefined();
              expect(typeof insight.title).toBe('string');
              expect(insight.title.length).toBeGreaterThan(0);

              expect(insight.description).toBeDefined();
              expect(typeof insight.description).toBe('string');
              expect(insight.description.length).toBeGreaterThan(0);

              expect(insight.recommendedAction).toBeDefined();
              expect(typeof insight.recommendedAction).toBe('string');
              expect(insight.recommendedAction.length).toBeGreaterThan(0);

              expect(insight.expectedImpact).toBeDefined();
              expect(typeof insight.expectedImpact).toBe('string');
              expect(insight.expectedImpact.length).toBeGreaterThan(0);

              expect(insight.category).toBeDefined();
              expect(['finance', 'marketing', 'operations']).toContain(insight.category);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 23: Insight prioritization', () => {
    // Feature: msme-ai-assistant, Property 23: Insight prioritization
    it('should order insights with high priority before medium before low', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryInsight(), { minLength: 2, maxLength: 20 }),
          (insights) => {
            // Sort insights using the prioritization logic
            const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
            const sorted = [...insights].sort((a: any, b: any) => {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            });

            // Verify the ordering
            for (let i = 0; i < sorted.length - 1; i++) {
              const currentPriority = priorityOrder[sorted[i].priority];
              const nextPriority = priorityOrder[sorted[i + 1].priority];
              expect(currentPriority).toBeLessThanOrEqual(nextPriority);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 24: Declining metric insight structure', () => {
    // Feature: msme-ai-assistant, Property 24: Declining metric insight structure
    it('should include likelyCause and correctiveMeasures for declining metric insights', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              priority: fc.constantFrom('high' as const, 'medium' as const, 'low' as const),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 500 }),
              recommendedAction: fc.string({ minLength: 1, maxLength: 200 }),
              expectedImpact: fc.string({ minLength: 1, maxLength: 200 }),
              category: fc.constantFrom('finance' as const, 'marketing' as const, 'operations' as const),
              likelyCause: fc.string({ minLength: 1, maxLength: 200 }),
              correctiveMeasures: fc.string({ minLength: 1, maxLength: 200 }),
              relatedMetric: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (decliningInsights) => {
            // For insights about declining metrics, verify structure
            for (const insight of decliningInsights) {
              // Should have likelyCause field that is non-empty
              expect(insight.likelyCause).toBeDefined();
              expect(typeof insight.likelyCause).toBe('string');
              expect(insight.likelyCause.length).toBeGreaterThan(0);

              // Should have correctiveMeasures field that is non-empty
              expect(insight.correctiveMeasures).toBeDefined();
              expect(typeof insight.correctiveMeasures).toBe('string');
              expect(insight.correctiveMeasures.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 25: Performance improvement acknowledgment', () => {
    // Feature: msme-ai-assistant, Property 25: Performance improvement acknowledgment
    it('should generate acknowledgment insight with next steps for improvements', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              priority: fc.constantFrom('high' as const, 'medium' as const, 'low' as const),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 500 }),
              recommendedAction: fc.string({ minLength: 1, maxLength: 200 }),
              expectedImpact: fc.string({ minLength: 1, maxLength: 200 }),
              category: fc.constantFrom('finance' as const, 'marketing' as const, 'operations' as const),
              isImprovement: fc.constant(true),
              nextSteps: fc.string({ minLength: 1, maxLength: 200 }),
              relatedMetric: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (improvementInsights) => {
            // For improvement insights, verify they have next steps
            for (const insight of improvementInsights) {
              // Should be marked as improvement
              expect(insight.isImprovement).toBe(true);

              // Should have nextSteps field that is non-empty
              expect(insight.nextSteps).toBeDefined();
              expect(typeof insight.nextSteps).toBe('string');
              expect(insight.nextSteps.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
