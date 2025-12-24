import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'msme_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production',
  },
  
  ai: {
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-pro',
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
    poeApiKey: process.env.POE_API_KEY || '',
    poeBot: process.env.POE_BOT || 'Claude-3-Haiku', // Default bot
  },
};

export default config;
