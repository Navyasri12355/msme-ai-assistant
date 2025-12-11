import { pool } from '../config/database';
import { Transaction, CreateTransactionData, TransactionFilters } from '../types';
import { encrypt, decrypt, encryptNumber, decryptNumber } from '../utils/encryption';

export class TransactionModel {
  /**
   * Create a new transaction
   */
  static async create(data: CreateTransactionData): Promise<Transaction> {
    // Encrypt sensitive financial data
    const encryptedAmount = encryptNumber(data.amount);
    
    const result = await pool.query(
      `INSERT INTO transactions (
        user_id, amount, type, category, description, date,
        payment_method, customer_id, product_id, metadata,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        data.userId,
        encryptedAmount,
        data.type || null,
        data.category || null,
        data.description,
        data.date,
        data.paymentMethod || null,
        data.customerId || null,
        data.productId || null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    return this.mapRowToTransaction(result.rows[0]);
  }

  /**
   * Create multiple transactions in batch
   */
  static async createBatch(transactions: CreateTransactionData[]): Promise<Transaction[]> {
    if (transactions.length === 0) {
      return [];
    }

    const values: any[] = [];
    const placeholders: string[] = [];
    let paramCount = 1;

    transactions.forEach((data) => {
      placeholders.push(
        `($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, NOW(), NOW())`
      );
      // Encrypt sensitive financial data
      const encryptedAmount = encryptNumber(data.amount);
      values.push(
        data.userId,
        encryptedAmount,
        data.type || null,
        data.category || null,
        data.description,
        data.date,
        data.paymentMethod || null,
        data.customerId || null,
        data.productId || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      );
    });

    const result = await pool.query(
      `INSERT INTO transactions (
        user_id, amount, type, category, description, date,
        payment_method, customer_id, product_id, metadata,
        created_at, updated_at
      )
      VALUES ${placeholders.join(', ')}
      RETURNING *`,
      values
    );

    return result.rows.map(this.mapRowToTransaction);
  }

  /**
   * Find transaction by ID
   */
  static async findById(id: string, userId: string): Promise<Transaction | null> {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTransaction(result.rows[0]);
  }

  /**
   * Find transactions by user with optional filters
   */
  static async findByUser(
    userId: string,
    filters?: TransactionFilters
  ): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 2;

    if (filters?.startDate) {
      query += ` AND date >= $${paramCount++}`;
      values.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND date <= $${paramCount++}`;
      values.push(filters.endDate);
    }

    if (filters?.category) {
      query += ` AND category = $${paramCount++}`;
      values.push(filters.category);
    }

    if (filters?.type) {
      query += ` AND type = $${paramCount++}`;
      values.push(filters.type);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const result = await pool.query(query, values);
    return result.rows.map(this.mapRowToTransaction);
  }

  /**
   * Delete transaction
   */
  static async delete(id: string, userId: string): Promise<void> {
    await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
  }

  /**
   * Validate transaction data
   * Returns array of validation errors, empty if valid
   */
  static validateTransaction(data: CreateTransactionData): string[] {
    const errors: string[] = [];

    // Required field: amount
    if (data.amount === undefined || data.amount === null) {
      errors.push('amount is required');
    } else if (typeof data.amount !== 'number') {
      errors.push('amount must be a number');
    } else if (data.amount === 0) {
      errors.push('amount cannot be zero');
    }

    // Required field: date
    if (!data.date) {
      errors.push('date is required');
    } else {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('date must be a valid date');
      }
    }

    // Required field: description
    if (data.description === undefined || data.description === null) {
      errors.push('description is required');
    } else if (typeof data.description !== 'string') {
      errors.push('description must be a string');
    } else if (data.description.trim().length === 0) {
      errors.push('description cannot be empty');
    }

    return errors;
  }

  /**
   * Map database row to Transaction type
   */
  private static mapRowToTransaction(row: any): Transaction {
    // Decrypt sensitive financial data
    const amount = typeof row.amount === 'string' 
      ? decryptNumber(row.amount) 
      : parseFloat(row.amount);
    
    return {
      id: row.id,
      userId: row.user_id,
      amount,
      type: row.type,
      category: row.category,
      description: row.description,
      date: row.date,
      paymentMethod: row.payment_method,
      customerId: row.customer_id,
      productId: row.product_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
