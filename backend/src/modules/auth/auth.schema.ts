import { z } from 'zod';

/**
 * Authentication Module Schemas
 * We define validation constraints for incoming payload requests.
 * By using Zod, we prevent SQL parameter issues and malformed JSON payloads.
 */

// Schema validating register requests. Ensures name/email exist and password is secure.
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STORE_ADMIN', 'CUSTOMER']).optional().default('STORE_ADMIN'),
});

// Schema validating login requests.
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Infer static TypeScript type descriptors from runtime Zod schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
