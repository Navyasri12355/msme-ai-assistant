import { apiClient } from './client';
import { ApiResponse, BusinessProfile, CreateBusinessProfileData, UpdateBusinessProfileData } from '../types';

export const profileApi = {
  // Create business profile
  create: async (data: CreateBusinessProfileData): Promise<BusinessProfile> => {
    const response = await apiClient.post<ApiResponse<{ profile: BusinessProfile }>>(
      '/profile',
      data
    );
    return response.data.data.profile;
  },

  // Get business profile
  get: async (): Promise<BusinessProfile> => {
    const response = await apiClient.get<ApiResponse<{ profile: BusinessProfile }>>(
      '/profile'
    );
    return response.data.data.profile;
  },

  // Update business profile
  update: async (data: UpdateBusinessProfileData): Promise<BusinessProfile> => {
    const response = await apiClient.put<ApiResponse<{ profile: BusinessProfile }>>(
      '/profile',
      data
    );
    return response.data.data.profile;
  },
};
