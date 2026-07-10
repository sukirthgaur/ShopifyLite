import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

/**
 * Role-Based Access Control (RBAC) Middleware Guard
 * This middleware acts as a factory, returning a custom Express middleware handler configured
 * with the roles allowed to access a specific endpoint.
 * 
 * Usage:
 * `router.post('/stores', authenticate, requireRole('SUPER_ADMIN'), createStore)`
 * 
 * @param allowedRoles List of roles permitted to invoke this endpoint
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // 1. Ensure authenticate middleware has already run and populated req.user
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    // 2. Validate if the authenticated user's role is in the authorized roles list
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      );
    }

    // 3. Authorization succeeded, move to next handler
    next();
  };
};
