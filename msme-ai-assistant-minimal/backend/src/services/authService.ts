import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel } from '../models/User';
import config from '../config/env';
import { User } from '../types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Create user
    const user = await UserModel.create(email, password);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Generate JWT tokens
   */
  static generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyToken(refreshToken);
    
    // Verify user still exists
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user);
  }
}
