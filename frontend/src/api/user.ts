import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  transactionCount: number;
  conversationCount: number;
  insightsCount: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  /**
   * Get user profile information
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/user/profile');
    return response.data.data;
  },

  /**
   * Update user profile information
   */
  updateProfile: async (data: Partial<Pick<UserProfile, 'email'>>): Promise<UserProfile> => {
    const response = await apiClient.put<ApiResponse<UserProfile>>('/user/profile', data);
    return response.data.data;
  },

  /**
   * Change user password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/user/change-password', data);
    return response.data.data;
  },

  /**
   * Get user account statistics
   */
  getStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<ApiResponse<UserStats>>('/user/stats');
    return response.data.data;
  },
};