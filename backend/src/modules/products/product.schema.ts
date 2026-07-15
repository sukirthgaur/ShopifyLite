import { z } from 'zod';

/**
 * Products Module Request Validation Schemas
 */

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be a positive number'),
  images: z.array(z.string().url('Image URL must be a valid URL')).min(1, 'At least one image is required'),
  stock: z.number().int('Stock must be an integer').nonnegative('Stock cannot be negative').default(0),
  categoryId: z.string().uuid('Category ID must be a valid UUID').nullable().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  images: z.array(z.string().url('Image URL must be a valid URL')).min(1, 'At least one image is required').optional(),
  stock: z.number().int('Stock must be an integer').nonnegative('Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid('Category ID must be a valid UUID').nullable().optional(),
});


export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

