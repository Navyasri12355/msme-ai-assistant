import { Router, Request, Response } from 'express';
import { TransactionModel } from '../models/Transaction';
import { authenticate } from '../middleware/auth';
import { CreateTransactionData, TransactionFilters } from '../types';
import { FinanceService } from '../services/financeService';
import { CacheService, CacheKeys } from '../utils/cache';

const router = Router();

/**
 * POST /api/transactions
 * Create a single transaction
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactionData: CreateTransactionData = {
      userId,
      amount: req.body.amount,
      type: req.body.type,
      category: req.body.category,
      description: req.body.description,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      paymentMethod: req.body.paymentMethod,
      customerId: req.body.customerId,
      productId: req.body.productId,
      metadata: req.body.metadata,
    };

    // Validate transaction
    const validationErrors = TransactionModel.validateTransaction(transactionData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaction validation failed',
          details: validationErrors.join(', '),
          suggestion: 'Please ensure all required fields are provided correctly',
          timestamp: new Date(),
        },
      });
    }

    const transaction = await TransactionModel.create(transactionData);

    // Invalidate dashboard cache since financial data changed
    await CacheService.deletePattern(CacheKeys.dashboardPattern(userId));

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create transaction',
        details: error.message,
        timestamp: new Date(),
      },
    });
  }
});

/**
 * POST /api/transactions/batch
 * Create multiple transactions
 */
router.post('/batch', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactionsData = req.body.transactions;

    if (!Array.isArray(transactionsData)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Transactions must be an array',
          suggestion: 'Provide an array of transaction objects',
          timestamp: new Date(),
        },
      });
    }

    // Validate all transactions
    const validationResults: { index: number; errors: string[] }[] = [];
    const validTransactions: CreateTransactionData[] = [];

    transactionsData.forEach((data, index) => {
      const transactionData: CreateTransactionData = {
        userId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        paymentMethod: data.paymentMethod,
        customerId: data.customerId,
        productId: data.productId,
        metadata: data.metadata,
      };

      const errors = TransactionModel.validateTransaction(transactionData);
      if (errors.length > 0) {
        validationResults.push({ index, errors });
      } else {
        validTransactions.push(transactionData);
      }
    });

    // If there are validation errors, return them
    if (validationResults.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some transactions failed validation',
          details: JSON.stringify(validationResults),
          suggestion: 'Fix the invalid transactions and try again',
          timestamp: new Date(),
        },
      });
    }

    const transactions = await TransactionModel.createBatch(validTransactions);

    // Invalidate dashboard cache since financial data changed
    await CacheService.deletePattern(CacheKeys.dashboardPattern(userId));

    res.status(201).json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('Error creating batch transactions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create transactions',
        details: error.message,
        timestamp: new Date(),
      },
    });
  }
});

/**
 * GET /api/transactions
 * Get transactions with optional filters
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const filters: TransactionFilters = {};
    
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    
    if (req.query.category) {
      filters.category = req.query.category as string;
    }
    
    if (req.query.type) {
      filters.type = req.query.type as 'income' | 'expense';
    }

    const transactions = await TransactionModel.findByUser(userId, filters);

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch transactions',
        details: error.message,
        timestamp: new Date(),
      },
    });
  }
});

/**
 * GET /api/transactions/:id
 * Get a specific transaction
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactionId = req.params.id;

    const transaction = await TransactionModel.findById(transactionId, userId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found',
          suggestion: 'Check the transaction ID and try again',
          timestamp: new Date(),
        },
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch transaction',
        details: error.message,
        timestamp: new Date(),
      },
    });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const transactionId = req.params.id;

    await TransactionModel.delete(transactionId, userId);

    // Invalidate dashboard cache since financial data changed
    await CacheService.deletePattern(CacheKeys.dashboardPattern(userId));

    res.json({
      success: true,
      data: {
        message: 'Transaction deleted successfully',
      },
    });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete transaction',
        details: error.message,
        timestamp: new Date(),
      },
    });
  }
});

/**
 * GET /api/transactions/forecast
 * Generate cash flow forecast
 */
router.get('/forecast', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 3;

    if (months < 1 || months > 12) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Months must be between 1 and 12',
          suggestion: 'Provide a valid number of months for forecasting',
          timestamp: new Date(),
        },
      });
    }

    const forecast = await FinanceService.generateForecast(userId, months);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    
    // Handle insufficient data error
    if (error.message && error.message.includes('Insufficient data')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_DATA',
          message: error.message,
          suggestion: 'Add more historical transactions to generate accurate forecasts',
          timestamp: new Date(),
        },
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate forecast',
        details: error.message,
        timestamp: new Date(),
      },
    });
  }
});

export default router;
