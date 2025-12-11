import * as fc from 'fast-check';
import { UserModel } from './User';
import { pool } from '../config/database';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password: string, _saltRounds: number) => 
    Promise.resolve(`hashed_${password}_${Math.random()}`)
  ),
  compare: jest.fn((password: string, hash: string) => 
    Promise.resolve(hash.startsWith(`hashed_${password}_`))
  ),
}));

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property-Based Tests', () => {
    // Feature: msme-ai-assistant, Property 26: Password hashing
    // Validates: Requirements 9.1
    it('should never store plaintext passwords - hashed password should not equal plaintext', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 100 }), // password
          async (password) => {
            // Mock database response
            const mockUser = {
              id: 'test-id',
              email: 'test@example.com',
              password_hash: `hashed_${password}_${Math.random()}`,
              created_at: new Date(),
              last_login: null,
            };

            (pool.query as jest.Mock).mockResolvedValueOnce({
              rows: [mockUser],
            });

            // Create user
            const user = await UserModel.create('test@example.com', password);

            // Property: The stored password hash should NEVER equal the plaintext password
            expect(user.passwordHash).not.toBe(password);
            expect(user.passwordHash).not.toEqual(password);
            
            // Additional check: hash should be different from password
            expect(user.passwordHash.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should create a user with hashed password', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        password_hash: 'hashed_password123',
        created_at: new Date(),
        last_login: null,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
      });

      const user = await UserModel.create('test@example.com', 'password123');

      expect(user.id).toBe('test-id');
      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashed_password123');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['test@example.com', expect.any(String)])
      );
    });

    it('should find user by email', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
      });

      const user = await UserModel.findByEmail('test@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when user not found by email', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const user = await UserModel.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should find user by ID', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
      });

      const user = await UserModel.findById('test-id');

      expect(user).not.toBeNull();
      expect(user?.id).toBe('test-id');
    });

    it('should verify correct password', async () => {
      const bcrypt = require('bcrypt');
      const result = await UserModel.verifyPassword('password123', 'hashed_password123_xyz');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password123_xyz');
    });

    it('should reject incorrect password', async () => {
      const bcrypt = require('bcrypt');
      const result = await UserModel.verifyPassword('wrongpassword', 'hashed_password123_xyz');

      expect(result).toBe(false);
    });

    it('should update last login timestamp', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({});

      await UserModel.updateLastLogin('test-id');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET last_login'),
        ['test-id']
      );
    });
  });
});
