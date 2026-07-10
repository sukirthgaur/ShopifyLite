import { z } from 'zod';

// Slug regex constraints matching only lowercase letters, numbers, and hyphens (URL-friendly format)
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Stores Module Request Validation Schemas
 */

// Schema validating storefront creation payloads.
export const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  // Slug acts as a unique tenant identifier in routes
  slug: z.string().min(1, 'Slug is required').regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  // Optional user ID mapping to tie a merchant to the store immediately (used by SUPER_ADMINs)
  userId: z.string().uuid('Invalid user ID').optional(),
});

// Schema validating storefront update payloads.
export const updateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').optional(),
  slug: z.string().regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  // Toggle storefront access (restricted updates for non-admins)
  isActive: z.boolean().optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
