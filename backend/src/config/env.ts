import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from the .env file into process.env
dotenv.config();

/**
 * Environment Variable Schema Validation
 * We use Zod to validate all expected configuration variables on server startup.
 * If any crucial environment variables (like DATABASE_URL or JWT_SECRET) are missing,
 * the application will throw a validation error and crash immediately rather than failing silently later.
 */
const envSchema = z.object({
  // The PostgreSQL connection URI
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL environment variable is required',
  }),
  
  // The secret key used for signing and verifying JSON Web Tokens (JWT)
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET environment variable is required',
  }),
  
  // Token expiration duration (defaults to '7d' if not supplied)
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Port number the Express API server listens on (coerced from string to number, defaults to 5000)
  PORT: z.coerce.number().default(5000),
  
  // Frontend client origin URL to configure CORS permissions (defaults to local Vite port)
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Cloudinary configuration credentials
  CLOUDINARY_CLOUD_NAME: z.string({
    required_error: 'CLOUDINARY_CLOUD_NAME environment variable is required',
  }),
  CLOUDINARY_API_KEY: z.string({
    required_error: 'CLOUDINARY_API_KEY environment variable is required',
  }),
  CLOUDINARY_API_SECRET: z.string({
    required_error: 'CLOUDINARY_API_SECRET environment variable is required',
  }),
});

// Parse and validate current process.env. Throws if validation fails.
export const env = envSchema.parse(process.env);
