import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: Role;
  storeId: string | null;
}

// Extend Express Request to include authenticated user data
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
