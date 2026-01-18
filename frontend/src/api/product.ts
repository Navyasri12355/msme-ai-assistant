import { apiClient } from './client';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost?: number;
  category?: string;
  stock_quantity: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost?: number;
  category?: string;
  stock_quantity?: number;
  unit?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  discontinued: number;
  lowStock: number;
  categories: { category: string; count: number }[];
}

export interface ProductQuery {
  status?: 'active' | 'inactive' | 'discontinued';
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const productApi = {
  // Get all products
  getProducts: async (query?: ProductQuery): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.category) params.append('category', query.category);
    if (query?.search) params.append('search', query.search);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get product statistics
  getProductStats: async (): Promise<ProductStats> => {
    const response = await apiClient.get('/products/stats');
    return response.data;
  },

  // Get product categories
  getProductCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/products/categories');
    return response.data;
  },

  // Get a specific product
  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Create a new product
  createProduct: async (data: CreateProductData): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  // Update a product
  updateProduct: async (id: string, data: UpdateProductData): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  // Delete a product
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  }
};