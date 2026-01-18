import { apiClient } from './client';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
}

export interface CustomerQuery {
  status?: 'active' | 'inactive';
  search?: string;
  limit?: number;
  offset?: number;
}

export const customerApi = {
  // Get all customers
  getCustomers: async (query?: CustomerQuery): Promise<Customer[]> => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/customers?${queryString}` : '/customers';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async (): Promise<CustomerStats> => {
    const response = await apiClient.get('/customers/stats');
    return response.data;
  },

  // Get a specific customer
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  // Create a new customer
  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  // Update a customer
  updateCustomer: async (id: string, data: UpdateCustomerData): Promise<Customer> => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete a customer
  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  }
};