import { CacheService, CacheKeys, CacheTTL } from './cache';
import { redisClient } from '../config/redis';

// Mock Redis client
jest.mock('../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
  },
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testData = { foo: 'bar' };
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(testData));

      const result = await CacheService.get('test-key');

      expect(result).toEqual(testData);
      expect(redisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const result = await CacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (redisClient.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const result = await CacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      const testData = { foo: 'bar' };
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      await CacheService.set('test-key', testData, 300);

      expect(redisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(testData)
      );
    });

    it('should handle errors gracefully', async () => {
      (redisClient.setEx as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(CacheService.set('test-key', {}, 300)).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete key', async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      await CacheService.delete('test-key');

      expect(redisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('deletePattern', () => {
    it('should delete all keys matching pattern', async () => {
      (redisClient.keys as jest.Mock).mockResolvedValue(['key1', 'key2', 'key3']);
      (redisClient.del as jest.Mock).mockResolvedValue(3);

      await CacheService.deletePattern('test:*');

      expect(redisClient.keys).toHaveBeenCalledWith('test:*');
      expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should not call del when no keys match', async () => {
      (redisClient.keys as jest.Mock).mockResolvedValue([]);

      await CacheService.deletePattern('test:*');

      expect(redisClient.keys).toHaveBeenCalledWith('test:*');
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      (redisClient.exists as jest.Mock).mockResolvedValue(1);

      const result = await CacheService.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      (redisClient.exists as jest.Mock).mockResolvedValue(0);

      const result = await CacheService.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { foo: 'bar' };
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const callback = jest.fn();
      const result = await CacheService.getOrSet('test-key', 300, callback);

      expect(result).toEqual(cachedData);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should execute callback and cache result if not exists', async () => {
      const freshData = { foo: 'baz' };
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      const callback = jest.fn().mockResolvedValue(freshData);
      const result = await CacheService.getOrSet('test-key', 300, callback);

      expect(result).toEqual(freshData);
      expect(callback).toHaveBeenCalled();
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(freshData)
      );
    });
  });
});

describe('CacheKeys', () => {
  it('should generate dashboard data key', () => {
    expect(CacheKeys.dashboardData('user123')).toBe('dashboard:user123');
  });

  it('should generate dashboard metrics key', () => {
    expect(CacheKeys.dashboardMetrics('user123')).toBe('dashboard:metrics:user123');
  });

  it('should generate dashboard trends key', () => {
    expect(CacheKeys.dashboardTrends('user123', ['revenue', 'customers'])).toBe(
      'dashboard:trends:user123:customers,revenue'
    );
  });

  it('should generate marketing strategies key with budget', () => {
    expect(CacheKeys.marketingStrategies('user123', 5000)).toBe(
      'marketing:strategies:user123:5000'
    );
  });

  it('should generate marketing strategies key without budget', () => {
    expect(CacheKeys.marketingStrategies('user123')).toBe(
      'marketing:strategies:user123:all'
    );
  });

  it('should generate content suggestions key', () => {
    expect(CacheKeys.contentSuggestions('user123', 5)).toBe(
      'marketing:content:user123:5'
    );
  });

  it('should generate sentiment analysis key', () => {
    expect(CacheKeys.sentimentAnalysis('abc123')).toBe('marketing:sentiment:abc123');
  });

  it('should generate dashboard pattern', () => {
    expect(CacheKeys.dashboardPattern('user123')).toBe('dashboard:*:user123*');
  });

  it('should generate marketing pattern', () => {
    expect(CacheKeys.marketingPattern('user123')).toBe('marketing:*:user123*');
  });
});

describe('CacheTTL', () => {
  it('should have correct TTL values', () => {
    expect(CacheTTL.DASHBOARD_DATA).toBe(5 * 60); // 5 minutes
    expect(CacheTTL.MARKETING_STRATEGIES).toBe(60 * 60); // 1 hour
    expect(CacheTTL.SENTIMENT_ANALYSIS).toBe(24 * 60 * 60); // 24 hours
    expect(CacheTTL.CONTENT_SUGGESTIONS).toBe(60 * 60); // 1 hour
  });
});
