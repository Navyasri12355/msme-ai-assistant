import request from 'supertest';
import app from '../index';
import { pool } from '../config/database';
import { TransactionModel } from '../models/Transaction';
import jwt from 'jsonwebtoken';
import config from '../config/env';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
    end: jest.fn(),
  },
}));

describe('Dashboard Routes', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Mock user creation
    userId = 'test-user-id';
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: userId }]
    });

    // Generate auth token
    authToken = jwt.sign({ userId }, config.jwt.secret, { expiresIn: '1h' });

    // Create test transactions
    const today = new Date();
    await TransactionModel.create({
      userId,
      amount: 1000,
      type: 'income',
      category: 'Sales',
      description: 'Test sale',
      date: today
    });

    await TransactionModel.create({
      userId,
      amount: -500,
      type: 'expense',
      category: 'Rent',
      description: 'Test expense',
      date: today
    });
  });

  afterAll(async () => {
    // Mock cleanup
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return complete dashboard data', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('keyMetrics');
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('lastUpdated');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/metrics', () => {
    it('should return key metrics', async () => {
      const response = await request(app)
        .get('/api/dashboard/metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dailyRevenue');
      expect(response.body.data).toHaveProperty('totalCustomers');
      expect(response.body.data).toHaveProperty('topProducts');
      expect(response.body.data).toHaveProperty('revenueChange');
      expect(response.body.data).toHaveProperty('customerChange');
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should return metric trends', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends?metrics=revenue,customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should use default metrics if none specified', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/dashboard/insights', () => {
    it('should return actionable insights', async () => {
      const response = await request(app)
        .get('/api/dashboard/insights')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Each insight should have required fields
      if (response.body.data.length > 0) {
        const insight = response.body.data[0];
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('priority');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('recommendedAction');
        expect(insight).toHaveProperty('expectedImpact');
        expect(insight).toHaveProperty('category');
      }
    });
  });

  describe('POST /api/dashboard/refresh', () => {
    it('should refresh dashboard metrics', async () => {
      const response = await request(app)
        .post('/api/dashboard/refresh')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
    });
  });
});
