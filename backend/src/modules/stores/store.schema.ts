import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  slug: z.string().min(1, 'Slug is required').regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  userId: z.string().uuid('Invalid user ID').optional(),
});

export const updateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').optional(),
  slug: z.string().regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  isActive: z.boolean().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
