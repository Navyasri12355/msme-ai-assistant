import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone must be less than 50 characters').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional().default('active')
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone must be less than 50 characters').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional()
});

export const customerQuerySchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export type CreateCustomerData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerData = z.infer<typeof updateCustomerSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;