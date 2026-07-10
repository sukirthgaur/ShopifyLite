import { z } from 'zod';

/**
 * Users Module Validation Schemas
 */

// Schema validating user creation payloads.
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'STORE_ADMIN']).default('STORE_ADMIN').optional(),
  // Optional storefront association (UUID)
  storeId: z.string().uuid('Invalid store ID').optional(),
});

// Schema validating user update payloads.
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['SUPER_ADMIN', 'STORE_ADMIN']).optional(),
  // Optional storefront association (UUID)
  storeId: z.string().uuid('Invalid store ID').optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
