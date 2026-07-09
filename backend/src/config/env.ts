import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
