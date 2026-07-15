import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../config/db.js';

/**
 * Authentication Middleware
 * Confirms that a client is logged in before letting the request reach the controllers.
 * 
 * 1. Extracts the "Bearer <token>" string from the HTTP "Authorization" header.
 * 2. Verifies that the JWT is valid and hasn't expired.
 * 3. Fetches the latest user status (role, storeId) from the database to prevent stale token issues.
 * 4. Attaches the current session context to the `req.user` object.
 * 5. Calls `next()` to proceed.
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  // Ensure authorization header exists and follows the Bearer schema
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required. Please provide a valid token.'));
  }

  // Extract the token part
  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new ApiError(401, 'Authentication required. Please provide a valid token.'));
  }

  try {
    // Decodes payload if signature is verified successfully
    const decoded = verifyToken(token);
    
    // Fetch latest user attributes from database to guarantee up-to-date role and storeId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { storeId: true, role: true },
    });

    if (!user) {
      return next(new ApiError(401, 'User not found.'));
    }

    // Assign the decoded and updated session metadata to the Request context
    req.user = {
      userId: decoded.userId,
      role: user.role,
      storeId: user.storeId,
      originalRole: user.role,
    };

    // If a SUPER_ADMIN wants to act as a store admin, override role and storeId for request scope
    if (user.role === 'SUPER_ADMIN' && req.headers['x-act-as-store-id']) {
      req.user.storeId = req.headers['x-act-as-store-id'] as string;
      req.user.role = 'STORE_ADMIN';
    }
    
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token. Please login again.'));
  }
};
