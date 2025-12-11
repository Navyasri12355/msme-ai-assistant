import request from 'supertest';
import express from 'express';
import transactionRoutes from './transaction';
import { TransactionModel } from '../models/Transaction';
import jwt from 'jsonwebtoken';
import config from '../config/env';

// Mock the Transaction model
jest.mock('../models/Transaction');

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/transactions', transactionRoutes);

describe('Transaction Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/transactions', () => {
    it('should create a transaction successfully', async () => {
      const mockTransaction = {
        id: 'trans-123',
        userId: 'test-user-id',
        amount: 100.50,
        type: 'income' as const,
        category: 'sales',
        description: 'Product sale',
        date: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (TransactionModel.validateTransaction as jest.Mock).mockReturnValue([]);
      (TransactionModel.create as jest.Mock).mockResolvedValue(mockTransaction);

      const response = await request(app)
        .post('/api/transactions')
        .send({
          amount: 100.50,
          type: 'income',
          category: 'sales',
          description: 'Product sale',
          date: '2024-01-15',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('trans-123');
    });

    it('should return validation error for invalid transaction', async () => {
      (TransactionModel.validateTransaction as jest.Mock).mockReturnValue([
        'amount is required',
        'description is required',
      ]);

      const response = await request(app)
        .post('/api/transactions')
        .send({
          type: 'income',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/transactions/batch', () => {
    it('should create multiple transactions successfully', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          userId: 'test-user-id',
          amount: 100,
          type: 'income' as const,
          category: 'sales',
          description: 'Sale 1',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'trans-2',
          userId: 'test-user-id',
          amount: 50,
          type: 'expense' as const,
          category: 'supplies',
          description: 'Office supplies',
          date: new Date('2024-01-16'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (TransactionModel.validateTransaction as jest.Mock).mockReturnValue([]);
      (TransactionModel.createBatch as jest.Mock).mockResolvedValue(mockTransactions);

      const response = await request(app)
        .post('/api/transactions/batch')
        .send({
          transactions: [
            {
              amount: 100,
              description: 'Sale 1',
              date: '2024-01-15',
            },
            {
              amount: 50,
              description: 'Office supplies',
              date: '2024-01-16',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);
    });

    it('should return validation errors for invalid transactions in batch', async () => {
      (TransactionModel.validateTransaction as jest.Mock)
        .mockReturnValueOnce([])
        .mockReturnValueOnce(['amount is required']);

      const response = await request(app)
        .post('/api/transactions/batch')
        .send({
          transactions: [
            {
              amount: 100,
              description: 'Valid transaction',
              date: '2024-01-15',
            },
            {
              description: 'Invalid - missing amount',
              date: '2024-01-16',
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error if transactions is not an array', async () => {
      const response = await request(app)
        .post('/api/transactions/batch')
        .send({
          transactions: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /api/transactions', () => {
    it('should retrieve transactions with filters', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          userId: 'test-user-id',
          amount: 100,
          type: 'income' as const,
          category: 'sales',
          description: 'Sale 1',
          date: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (TransactionModel.findByUser as jest.Mock).mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/transactions')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          category: 'sales',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(1);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should retrieve a specific transaction', async () => {
      const mockTransaction = {
        id: 'trans-123',
        userId: 'test-user-id',
        amount: 100,
        type: 'income' as const,
        category: 'sales',
        description: 'Sale 1',
        date: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (TransactionModel.findById as jest.Mock).mockResolvedValue(mockTransaction);

      const response = await request(app).get('/api/transactions/trans-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('trans-123');
    });

    it('should return 404 if transaction not found', async () => {
      (TransactionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/transactions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction successfully', async () => {
      (TransactionModel.delete as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/transactions/trans-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
