import { z } from 'zod';

/**
 * Categories Module Request Validation Schemas
 */

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
