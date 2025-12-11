import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { User } from '../types';

const SALT_ROUNDS = 10;

export class UserModel {
  /**
   * Create a new user with hashed password
   */
  static async create(email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id, email, password_hash, created_at, last_login`,
      [email, passwordHash]
    );
    
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, password_hash, created_at, last_login FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, password_hash, created_at, last_login FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Verify password against stored hash
   */
  static async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Map database row to User type
   */
  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      lastLogin: row.last_login,
    };
  }
}
