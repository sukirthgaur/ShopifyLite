import { Role } from '@prisma/client';

/**
 * JWT Token Payload structure
 * The parameters encoded into our authenticated user session token.
 */
export interface JwtPayload {
  // Database UUID of the user
  userId: string;
  
  // System authority level (SUPER_ADMIN or STORE_ADMIN)
  role: Role;
  
  // The tenant store associated with this merchant account. Null for SUPER_ADMINs.
  storeId: string | null;

  // The actual database role before acting-as overrides
  originalRole?: Role;
}

/**
 * TypeScript Express Context Extension
 * We extend Express's global namespace to add the `user` attribute to Request instances.
 * This enables type-safe checks in routes and controllers (e.g. `req.user.userId`).
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Backend Pagination Query Model
 * Page and limit bounds parameters used in SQL offset calculations.
 */
export interface PaginationQuery {
  page: number;
  limit: number;
}

/**
 * Pagination Meta Response Model
 * Parameters returned to frontend to handle active states inside pagination controls.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
