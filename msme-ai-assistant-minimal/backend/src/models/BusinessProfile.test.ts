import { BusinessProfileModel } from './BusinessProfile';
import { pool } from '../config/database';
import { encrypt, encryptNumber } from '../utils/encryption';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('BusinessProfileModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unit Tests', () => {
    const mockProfileData = {
      userId: 'user-123',
      businessName: 'Test Business',
      businessType: 'retail',
      industry: 'food-beverage',
      location: 'Mumbai, India',
      targetAudience: 'Local customers',
      monthlyRevenue: 50000,
      employeeCount: 5,
      establishedDate: new Date('2020-01-01'),
    };

    // Mock database row with encrypted sensitive fields
    const mockDbRow = {
      id: 'profile-123',
      user_id: 'user-123',
      business_name: 'Test Business',
      business_type: 'retail',
      industry: 'food-beverage',
      location: encrypt('Mumbai, India'),
      target_audience: 'Local customers',
      monthly_revenue: encryptNumber(50000),
      employee_count: 5,
      established_date: new Date('2020-01-01'),
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should create a business profile', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockDbRow],
      });

      const profile = await BusinessProfileModel.create(mockProfileData);

      expect(profile.id).toBe('profile-123');
      expect(profile.businessName).toBe('Test Business');
      expect(profile.businessType).toBe('retail');
      expect(profile.industry).toBe('food-beverage');
      expect(profile.monthlyRevenue).toBe(50000);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO business_profiles'),
        expect.arrayContaining([
          'user-123',
          'Test Business',
          'retail',
          'food-beverage',
          expect.any(String), // encrypted location
          'Local customers',
          expect.any(String), // encrypted monthly revenue
          5,
          mockProfileData.establishedDate,
        ])
      );
    });

    it('should find business profile by user ID', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockDbRow],
      });

      const profile = await BusinessProfileModel.findByUserId('user-123');

      expect(profile).not.toBeNull();
      expect(profile?.userId).toBe('user-123');
      expect(profile?.businessName).toBe('Test Business');
    });

    it('should return null when profile not found by user ID', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const profile = await BusinessProfileModel.findByUserId('nonexistent-user');

      expect(profile).toBeNull();
    });

    it('should find business profile by ID', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockDbRow],
      });

      const profile = await BusinessProfileModel.findById('profile-123');

      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('profile-123');
    });

    it('should update business profile', async () => {
      const updatedRow = {
        ...mockDbRow,
        business_name: 'Updated Business',
        employee_count: 10,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [updatedRow],
      });

      const profile = await BusinessProfileModel.update('user-123', {
        businessName: 'Updated Business',
        employeeCount: 10,
      });

      expect(profile.businessName).toBe('Updated Business');
      expect(profile.employeeCount).toBe(10);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE business_profiles'),
        expect.arrayContaining(['Updated Business', 10, 'user-123'])
      );
    });

    it('should handle update with no changes', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockDbRow],
      });

      const profile = await BusinessProfileModel.update('user-123', {});

      expect(profile).toBeDefined();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM business_profiles WHERE user_id'),
        ['user-123']
      );
    });

    it('should throw error when updating non-existent profile', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        BusinessProfileModel.update('nonexistent-user', { businessName: 'Test' })
      ).rejects.toThrow('Business profile not found');
    });

    it('should delete business profile', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({});

      await BusinessProfileModel.delete('user-123');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM business_profiles WHERE user_id'),
        ['user-123']
      );
    });

    it('should handle optional monthlyRevenue field', async () => {
      const rowWithoutRevenue = {
        ...mockDbRow,
        monthly_revenue: null,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [rowWithoutRevenue],
      });

      const profile = await BusinessProfileModel.findById('profile-123');

      expect(profile?.monthlyRevenue).toBeUndefined();
    });
  });
});
