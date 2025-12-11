import * as fc from 'fast-check';
import { TransactionModel } from './Transaction';
import { CreateTransactionData } from '../types';
import { pool } from '../config/database';
import { encryptNumber } from '../utils/encryption';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('TransactionModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property-Based Tests', () => {
    // Feature: msme-ai-assistant, Property 5: Invalid transaction flagging
    // Validates: Requirements 2.4
    it('should flag transactions with missing required fields as invalid', async () => {
      // Custom arbitraries for generating invalid transactions
      const invalidTransactionArbitrary = fc.oneof(
        // Missing amount
        fc.record({
          userId: fc.uuid(),
          amount: fc.constant(undefined as any),
          description: fc.string({ minLength: 1 }),
          date: fc.date(),
        }),
        // Amount is null
        fc.record({
          userId: fc.uuid(),
          amount: fc.constant(null as any),
          description: fc.string({ minLength: 1 }),
          date: fc.date(),
        }),
        // Amount is zero
        fc.record({
          userId: fc.uuid(),
          amount: fc.constant(0),
          description: fc.string({ minLength: 1 }),
          date: fc.date(),
        }),
        // Amount is not a number
        fc.record({
          userId: fc.uuid(),
          amount: fc.constant('not-a-number' as any),
          description: fc.string({ minLength: 1 }),
          date: fc.date(),
        }),
        // Missing date
        fc.record({
          userId: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
          description: fc.string({ minLength: 1 }),
          date: fc.constant(undefined as any),
        }),
        // Invalid date
        fc.record({
          userId: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
          description: fc.string({ minLength: 1 }),
          date: fc.constant('invalid-date' as any),
        }),
        // Missing description
        fc.record({
          userId: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
          description: fc.constant(undefined as any),
          date: fc.date(),
        }),
        // Empty description
        fc.record({
          userId: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
          description: fc.constant(''),
          date: fc.date(),
        }),
        // Whitespace-only description
        fc.record({
          userId: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
          description: fc.constant('   '),
          date: fc.date(),
        }),
        // Description is not a string
        fc.record({
          userId: fc.uuid(),
          amount: fc.double({ min: 0.01, max: 100000, noNaN: true }),
          description: fc.constant(123 as any),
          date: fc.date(),
        })
      );

      await fc.assert(
        fc.asyncProperty(invalidTransactionArbitrary, async (transactionData) => {
          // Validate the transaction
          const errors = TransactionModel.validateTransaction(
            transactionData as CreateTransactionData
          );

          // Property: For any transaction with missing required fields (amount, date, or description),
          // the validation should flag it as invalid (return at least one error)
          expect(errors.length).toBeGreaterThan(0);
          expect(Array.isArray(errors)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should validate a valid transaction with no errors', () => {
      const validTransaction: CreateTransactionData = {
        userId: 'user-123',
        amount: 100.50,
        description: 'Test transaction',
        date: new Date('2024-01-15'),
      };

      const errors = TransactionModel.validateTransaction(validTransaction);

      expect(errors).toEqual([]);
    });

    it('should flag missing amount', () => {
      const transaction: CreateTransactionData = {
        userId: 'user-123',
        amount: undefined as any,
        description: 'Test transaction',
        date: new Date(),
      };

      const errors = TransactionModel.validateTransaction(transaction);

      expect(errors).toContain('amount is required');
    });

    it('should flag zero amount', () => {
      const transaction: CreateTransactionData = {
        userId: 'user-123',
        amount: 0,
        description: 'Test transaction',
        date: new Date(),
      };

      const errors = TransactionModel.validateTransaction(transaction);

      expect(errors).toContain('amount cannot be zero');
    });

    it('should flag missing date', () => {
      const transaction: CreateTransactionData = {
        userId: 'user-123',
        amount: 100,
        description: 'Test transaction',
        date: undefined as any,
      };

      const errors = TransactionModel.validateTransaction(transaction);

      expect(errors).toContain('date is required');
    });

    it('should flag invalid date', () => {
      const transaction: CreateTransactionData = {
        userId: 'user-123',
        amount: 100,
        description: 'Test transaction',
        date: new Date('invalid'),
      };

      const errors = TransactionModel.validateTransaction(transaction);

      expect(errors).toContain('date must be a valid date');
    });

    it('should flag missing description', () => {
      const transaction: CreateTransactionData = {
        userId: 'user-123',
        amount: 100,
        description: undefined as any,
        date: new Date(),
      };

      const errors = TransactionModel.validateTransaction(transaction);

      expect(errors).toContain('description is required');
    });

    it('should flag empty description', () => {
      const transaction: CreateTransactionData = {
        userId: 'user-123',
        amount: 100,
        description: '',
        date: new Date(),
      };

      const errors = TransactionModel.validateTransaction(transaction);

      expect(errors).toContain('description cannot be empty');
    });

    it('should flag whitespace-only description', () => {
      const transaction: CreateTransactionData = {
        userId: 'user-123',
        amount: 100,
        description: '   ',
        date: new Date(),
      };

      const errors = TransactionModel.validateTransaction(transaction);

      expect(errors).toContain('description cannot be empty');
    });

    it('should create a transaction successfully', async () => {
      const mockTransaction = {
        id: 'trans-123',
        user_id: 'user-123',
        amount: encryptNumber(100.50),
        type: 'income',
        category: 'sales',
        description: 'Product sale',
        date: new Date('2024-01-15'),
        payment_method: 'cash',
        customer_id: null,
        product_id: null,
        metadata: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTransaction],
      });

      const transaction = await TransactionModel.create({
        userId: 'user-123',
        amount: 100.50,
        type: 'income',
        category: 'sales',
        description: 'Product sale',
        date: new Date('2024-01-15'),
        paymentMethod: 'cash',
      });

      expect(transaction.id).toBe('trans-123');
      expect(transaction.amount).toBe(100.50);
      expect(transaction.description).toBe('Product sale');
    });

    it('should find transactions by user with filters', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          user_id: 'user-123',
          amount: encryptNumber(100.00),
          type: 'income',
          category: 'sales',
          description: 'Sale 1',
          date: new Date('2024-01-15'),
          payment_method: null,
          customer_id: null,
          product_id: null,
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTransactions,
      });

      const transactions = await TransactionModel.findByUser('user-123', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('trans-1');
    });

    it('should create batch transactions', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          user_id: 'user-123',
          amount: encryptNumber(100.00),
          type: 'income',
          category: 'sales',
          description: 'Sale 1',
          date: new Date('2024-01-15'),
          payment_method: null,
          customer_id: null,
          product_id: null,
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'trans-2',
          user_id: 'user-123',
          amount: encryptNumber(50.00),
          type: 'expense',
          category: 'supplies',
          description: 'Office supplies',
          date: new Date('2024-01-16'),
          payment_method: null,
          customer_id: null,
          product_id: null,
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTransactions,
      });

      const transactions = await TransactionModel.createBatch([
        {
          userId: 'user-123',
          amount: 100,
          description: 'Sale 1',
          date: new Date('2024-01-15'),
        },
        {
          userId: 'user-123',
          amount: 50,
          description: 'Office supplies',
          date: new Date('2024-01-16'),
        },
      ]);

      expect(transactions).toHaveLength(2);
      expect(transactions[0].id).toBe('trans-1');
      expect(transactions[1].id).toBe('trans-2');
    });
  });
});
