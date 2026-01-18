import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional().or(z.literal('')),
  sku: z.string().max(100, 'SKU must be less than 100 characters').optional().or(z.literal('')),
  price: z.number().min(0, 'Price must be non-negative'),
  cost: z.number().min(0, 'Cost must be non-negative').optional(),
  category: z.string().max(100, 'Category must be less than 100 characters').optional().or(z.literal('')),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative').optional().default(0),
  unit: z.string().max(50, 'Unit must be less than 50 characters').optional().default('piece'),
  status: z.enum(['active', 'inactive', 'discontinued']).optional().default('active')
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  description: z.string().optional().or(z.literal('')),
  sku: z.string().max(100, 'SKU must be less than 100 characters').optional().or(z.literal('')),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  cost: z.number().min(0, 'Cost must be non-negative').optional(),
  category: z.string().max(100, 'Category must be less than 100 characters').optional().or(z.literal('')),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative').optional(),
  unit: z.string().max(50, 'Unit must be less than 50 characters').optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional()
});

export const productQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;