import { z } from 'zod';

/**
 * Products Module Request Validation Schemas
 */

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be a positive number'),
  imageUrl: z.string().url('Image URL must be a valid URL'),
  stock: z.number().int('Stock must be an integer').nonnegative('Stock cannot be negative').default(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  imageUrl: z.string().url('Image URL must be a valid URL').optional(),
  stock: z.number().int('Stock must be an integer').nonnegative('Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

