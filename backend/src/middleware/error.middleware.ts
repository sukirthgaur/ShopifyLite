import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

/**
 * Global Error Handler Middleware
 * Express recognizes this as an error-handling middleware because it accepts four arguments:
 * `(err, req, res, next)`.
 * 
 * Instead of crashing the server or sending default raw text stack traces, this catches errors
 * across our application and formats them into a clean JSON structure:
 * `{ success: false, message: string, errors: string[] }`
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  
  // 1. Handle Known API errors thrown intentionally using our `ApiError` class
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // 1.5. Handle Multer errors (e.g. file size limits, invalid upload field names)
  if (err instanceof multer.MulterError) {
    let errorMessage = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File too large. Maximum size is 5 MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMessage = 'Unexpected file field.';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      errors: [],
    });
    return;
  }

  // 2. Handle Zod validation errors (e.g. from request payload schema parsing)
  if (err instanceof ZodError) {
    // Map individual path errors to a flat string list (e.g., "email: Invalid email address")
    const formattedErrors = err.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    );
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  // 3. Handle Prisma unique constraint violations (e.g. email or slug duplicate key)
  // Prisma error code 'P2002' represents unique constraint check failures.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists`,
      errors: [],
    });
    return;
  }

  // 4. Unexpected errors — log stack traces on server for developer, but hide internal details from client
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  });
};
