import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Known API errors thrown intentionally
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
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

  // Prisma unique constraint violations
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${target} already exists`,
      errors: [],
    });
    return;
  }

  // Unexpected errors — don't leak internal details
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  });
};
