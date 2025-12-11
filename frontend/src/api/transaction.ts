import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  paymentMethod?: string;
  customerId?: string;
  productId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  amount: number;
  type?: 'income' | 'expense';
  category?: string;
  description: string;
  date: string;
  paymentMethod?: string;
  customerId?: string;
  productId?: string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'income' | 'expense';
}

export const transactionApi = {
  // Create a single transaction
  createTransaction: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>('/transactions', data);
    return response.data.data;
  },

  // Create multiple transactions (batch upload)
  createTransactionsBatch: async (transactions: CreateTransactionData[]): Promise<Transaction[]> => {
    const response = await apiClient.post<ApiResponse<{ transactions: Transaction[]; count: number }>>('/transactions/batch', {
      transactions,
    });
    return response.data.data.transactions;
  },

  // Get all transactions with optional filters
  getTransactions: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const response = await apiClient.get<ApiResponse<{ transactions: Transaction[]; count: number }>>('/transactions', {
      params: filters,
    });
    return response.data.data.transactions;
  },

  // Get a single transaction by ID
  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data.data;
  },

  // Update a transaction
  updateTransaction: async (id: string, data: Partial<CreateTransactionData>): Promise<Transaction> => {
    const response = await apiClient.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);
    return response.data.data;
  },

  // Delete a transaction
  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },
};
