import { PaginationQuery } from '../types/index.js';

/**
 * Pagination Query Parser Helper
 * Validates and normalizes raw page/limit search parameters from incoming HTTP requests.
 * 
 * - `page` is guaranteed to be at least 1.
 * - `limit` is bound between 1 and 100, default is 10 items.
 */
export const parsePagination = (query: Record<string, unknown>): PaginationQuery => {
  // Coerce parameter to a number, ensuring it is at least 1
  const page = Math.max(1, Number(query.page) || 1);
  
  // Coerce parameter, bound the size to protect the database from fetching too many records
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  
  return { page, limit };
};
