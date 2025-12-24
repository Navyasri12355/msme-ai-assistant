import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import config from './config/env';

dotenv.config();

const app: Express = express();
const port = config.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import rate limiter
import { rateLimiters } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/validation';

// Apply input sanitization to all routes
app.use(sanitizeInput);

// Apply general rate limiting to all API routes
app.use('/api', rateLimiters.general);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import businessProfileRoutes from './routes/businessProfile';
import transactionRoutes from './routes/transaction';
import financeRoutes from './routes/finance';
import marketingRoutes from './routes/marketing';
import dashboardRoutes from './routes/dashboard';
import conversationalAIRoutes from './routes/conversationalAI';

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'MSME AI Assistant API', version: '1.0.0' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/user', userRoutes);

// Business profile routes
app.use('/api/profile', businessProfileRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Finance routes
app.use('/api/finance', financeRoutes);

// Marketing routes
app.use('/api/marketing', marketingRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Conversational AI routes
app.use('/api/ai', conversationalAIRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize connections and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connected');

    // Connect to Redis
    await connectRedis();
    
    app.listen(port, () => {
      logger.info(`⚡️ Server is running at http://localhost:${port}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

// Start the server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
