import { apiClient } from './client';
import { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  // Register a new user
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      { email, password }
    );
    return response.data.data;
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      { email, password }
    );
    return response.data.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    const response = await apiClient.post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },
};
