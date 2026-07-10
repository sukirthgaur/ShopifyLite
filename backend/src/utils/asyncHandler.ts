import { Request, Response, NextFunction } from 'express';

// Type describing an asynchronous Express request handler function
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Async Handler Wrapper
 * Eliminates the need to wrap every route handler with try-catch blocks.
 * 
 * Takes an asynchronous middleware/controller function, returns a synchronous Express handler
 * that resolves the promise and forwards any thrown exceptions to Express's `next(err)` pipeline,
 * where they are caught by our global `errorHandler` middleware.
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
