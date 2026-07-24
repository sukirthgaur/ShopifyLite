import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../config/db.js';

// In-memory cache for user role/storeId lookup to eliminate per-request DB overhead
interface CachedUser {
  storeId: string | null;
  role: any;
  cachedAt: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Authentication Middleware
 * Confirms that a client is logged in before letting the request reach the controllers.
 * Uses an in-memory cache with TTL to eliminate per-request DB queries while ensuring credentials stay fresh.
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
    
    let user: { storeId: string | null; role: any } | null = null;
    const now = Date.now();
    const cached = userCache.get(decoded.userId);

    if (cached && (now - cached.cachedAt) < CACHE_TTL_MS) {
      user = { storeId: cached.storeId, role: cached.role };
    } else {
      // Fetch latest user attributes from database if cache miss or expired
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { storeId: true, role: true },
      });

      if (dbUser) {
        user = dbUser;
        userCache.set(decoded.userId, { storeId: dbUser.storeId, role: dbUser.role, cachedAt: now });
      }
    }

    if (!user) {
      return next(new ApiError(401, 'User not found.'));
    }

    // Assign session metadata to the Request context
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
