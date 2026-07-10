import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Authentication Middleware
 * Confirms that a client is logged in before letting the request reach the controllers.
 * 
 * 1. Extracts the "Bearer <token>" string from the HTTP "Authorization" header.
 * 2. Verifies that the JWT is valid and hasn't expired.
 * 3. Decodes the token payload (UserId, Role, StoreId) and attaches it to the custom `req.user` object.
 * 4. Calls `next()` to hand over execution to the next middleware or route handler.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  // Ensure authorization header exists and follows the Bearer schema
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please provide a valid token.');
  }

  // Extract the token part
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please provide a valid token.');
  }

  try {
    // Decodes payload if signature is verified successfully
    const decoded = verifyToken(token);
    
    // Assign the decoded session metadata to the Request context (requires custom Express type extension)
    req.user = decoded;
    
    // Execution proceeds to route controller
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token. Please login again.');
  }
};
