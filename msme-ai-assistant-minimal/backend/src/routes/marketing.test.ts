import request from 'supertest';
import express from 'express';
import marketingRoutes from './marketing';
import { BusinessProfileModel } from '../models/BusinessProfile';
import { authenticate } from '../middleware/auth';

// Mock dependencies
jest.mock('../models/BusinessProfile');
jest.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/marketing', marketingRoutes);

describe('Marketing Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticate middleware to add user to request
    (authenticate as jest.Mock).mockImplementation((req, _res, next) => {
      req.user = { userId: 'test-user-123', email: 'test@example.com' };
      next();
    });
  });

  describe('POST /api/marketing/strategies', () => {
    const mockProfile = {
      id: 'profile-123',
      userId: 'test-user-123',
      businessName: 'Test Business',
      businessType: 'retail' as const,
      industry: 'food-beverage' as const,
      location: 'Mumbai',
      targetAudience: 'Young professionals',
      employeeCount: 5,
      establishedDate: new Date('2020-01-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate marketing strategies without budget', async () => {
      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .post('/api/marketing/strategies')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.strategies).toBeDefined();
      expect(Array.isArray(response.body.data.strategies)).toBe(true);
      expect(response.body.data.strategies.length).toBeGreaterThanOrEqual(3);

      // Verify strategy structure
      const strategy = response.body.data.strategies[0];
      expect(strategy).toHaveProperty('id');
      expect(strategy).toHaveProperty('title');
      expect(strategy).toHaveProperty('description');
      expect(strategy).toHaveProperty('estimatedCost');
      expect(strategy).toHaveProperty('actionSteps');
      expect(strategy).toHaveProperty('difficulty');
      expect(strategy).toHaveProperty('timeline');
    });

    it('should generate marketing strategies with budget constraint', async () => {
      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(mockProfile);

      const budget = 5000;
      const response = await request(app)
        .post('/api/marketing/strategies')
        .send({ budget });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.strategies).toBeDefined();

      // All strategies should be within budget
      response.body.data.strategies.forEach((strategy: any) => {
        expect(strategy.estimatedCost).toBeLessThanOrEqual(budget);
      });
    });

    it('should return error when user has no business profile', async () => {
      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/marketing/strategies')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should return error when budget is invalid', async () => {
      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .post('/api/marketing/strategies')
        .send({ budget: -100 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
