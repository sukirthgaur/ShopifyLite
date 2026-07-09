import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please provide a valid token.');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please provide a valid token.');
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token. Please login again.');
  }
};
