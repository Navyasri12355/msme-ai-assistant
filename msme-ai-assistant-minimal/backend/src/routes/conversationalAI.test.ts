import request from 'supertest';
import express from 'express';
import conversationalAIRoutes from './conversationalAI';
import { pool } from '../config/database';
import jwt from 'jsonwebtoken';
import config from '../config/env';

// Mock dependencies
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../services/conversationalAIService');

// Mock the Gemini API to avoid quota issues during testing
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Mocked AI response with specific recommendations')
        }
      })
    })
  }))
}));

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-123', email: 'test@example.com' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/ai', conversationalAIRoutes);

// Mock error handler
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ success: false, error: { message: err.message } });
});

describe('Conversational AI Routes', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/query', () => {
    it('should process a valid query', async () => {
      const { ConversationalAIService } = require('../services/conversationalAIService');
      
      ConversationalAIService.processQuery = jest.fn().mockResolvedValue({
        message: 'Here are some cost-cutting strategies...',
        requiresClarification: false,
      });

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Business profile query
        .mockResolvedValueOnce({ rows: [] }); // Conversation storage

      const response = await request(app)
        .post('/api/ai/query')
        .send({ query: 'How can I reduce costs?' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.message).toBeTruthy();
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/ai/query')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_QUERY');
    });
  });

  describe('GET /api/ai/history', () => {
    it('should return conversation history', async () => {
      const { ConversationalAIService } = require('../services/conversationalAIService');
      
      ConversationalAIService.getConversationHistory = jest.fn().mockResolvedValue([
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date() },
      ]);

      const response = await request(app)
        .get('/api/ai/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/ai/context', () => {
    it('should clear conversation context', async () => {
      const { ConversationalAIService } = require('../services/conversationalAIService');
      
      ConversationalAIService.clearContext = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/ai/context');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('cleared');
    });
  });
});
