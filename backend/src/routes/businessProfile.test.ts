import request from 'supertest';
import express from 'express';
import businessProfileRoutes from './businessProfile';
import { BusinessProfileModel } from '../models/BusinessProfile';
import { authenticate } from '../middleware/auth';

// Mock dependencies
jest.mock('../models/BusinessProfile');
jest.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/profile', businessProfileRoutes);

describe('Business Profile Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticate middleware to add user to request
    (authenticate as jest.Mock).mockImplementation((req, _res, next) => {
      req.user = { userId: 'test-user-123', email: 'test@example.com' };
      next();
    });
  });

  describe('POST /api/profile', () => {
    const validProfileData = {
      businessName: 'Test Shop',
      businessType: 'retail',
      industry: 'food-beverage',
      location: 'Delhi, India',
      targetAudience: 'Local residents',
      employeeCount: 3,
      establishedDate: '2020-06-15',
    };

    it('should create a new business profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        ...validProfileData,
        establishedDate: new Date(validProfileData.establishedDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(null);
      (BusinessProfileModel.create as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .post('/api/profile')
        .send(validProfileData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.businessName).toBe('Test Shop');
    });

    it('should reject creation if profile already exists', async () => {
      const existingProfile = { id: 'profile-123', userId: 'test-user-123' };
      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(existingProfile);

      const response = await request(app)
        .post('/api/profile')
        .send(validProfileData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('PROFILE_EXISTS');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        businessName: '',
        businessType: 'retail',
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate business type enum', async () => {
      const invalidData = {
        ...validProfileData,
        businessType: 'invalid-type',
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('Invalid business type');
    });

    it('should validate industry enum', async () => {
      const invalidData = {
        ...validProfileData,
        industry: 'invalid-industry',
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('Invalid industry');
    });

    it('should validate employee count is positive', async () => {
      const invalidData = {
        ...validProfileData,
        employeeCount: -5,
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject future established dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidData = {
        ...validProfileData,
        establishedDate: futureDate.toISOString().split('T')[0],
      };

      const response = await request(app)
        .post('/api/profile')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept optional monthlyRevenue', async () => {
      const dataWithRevenue = {
        ...validProfileData,
        monthlyRevenue: 75000,
      };

      const mockProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        ...dataWithRevenue,
        establishedDate: new Date(dataWithRevenue.establishedDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(null);
      (BusinessProfileModel.create as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .post('/api/profile')
        .send(dataWithRevenue);

      expect(response.status).toBe(201);
      expect(response.body.data.profile.monthlyRevenue).toBe(75000);
    });
  });

  describe('GET /api/profile', () => {
    it('should retrieve user business profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'test-user-123',
        businessName: 'Test Shop',
        businessType: 'retail',
        industry: 'food-beverage',
        location: 'Delhi, India',
        targetAudience: 'Local residents',
        employeeCount: 3,
        establishedDate: new Date('2020-06-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(mockProfile);

      const response = await request(app).get('/api/profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.businessName).toBe('Test Shop');
    });

    it('should return 404 if profile not found', async () => {
      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app).get('/api/profile');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PROFILE_NOT_FOUND');
    });
  });

  describe('PUT /api/profile', () => {
    const existingProfile = {
      id: 'profile-123',
      userId: 'test-user-123',
      businessName: 'Old Name',
      businessType: 'retail',
      industry: 'food-beverage',
      location: 'Delhi, India',
      targetAudience: 'Local residents',
      employeeCount: 3,
      establishedDate: new Date('2020-06-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update business profile', async () => {
      const updateData = {
        businessName: 'Updated Shop Name',
        employeeCount: 5,
      };

      const updatedProfile = {
        ...existingProfile,
        ...updateData,
      };

      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(existingProfile);
      (BusinessProfileModel.update as jest.Mock).mockResolvedValueOnce(updatedProfile);

      const response = await request(app)
        .put('/api/profile')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.businessName).toBe('Updated Shop Name');
      expect(response.body.data.profile.employeeCount).toBe(5);
    });

    it('should return 404 if profile does not exist', async () => {
      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/api/profile')
        .send({ businessName: 'New Name' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PROFILE_NOT_FOUND');
    });

    it('should validate update data', async () => {
      const invalidData = {
        employeeCount: -10,
      };

      const response = await request(app)
        .put('/api/profile')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should allow partial updates', async () => {
      const updateData = {
        location: 'Mumbai, India',
      };

      const updatedProfile = {
        ...existingProfile,
        location: 'Mumbai, India',
      };

      (BusinessProfileModel.findByUserId as jest.Mock).mockResolvedValueOnce(existingProfile);
      (BusinessProfileModel.update as jest.Mock).mockResolvedValueOnce(updatedProfile);

      const response = await request(app)
        .put('/api/profile')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.profile.location).toBe('Mumbai, India');
    });
  });
});
