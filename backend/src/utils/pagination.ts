import { PaginationQuery } from '../types/index.js';

export const parsePagination = (query: Record<string, unknown>): PaginationQuery => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  return { page, limit };
};
