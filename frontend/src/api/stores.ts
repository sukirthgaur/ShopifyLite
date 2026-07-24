import client from './client';
import type { ApiResponse, Store, StoreListResponse } from '../types';

/**
 * Stores Module API Client functions
 * These methods wrap endpoints using a customized Axios client instance.
 * We pass two type arguments to `client.post` / `client.get`:
 *   1st: The structure of the resolved response body data.
 *   2nd: The type returned inside standard error rejections.
 */

// POST /stores - Create a new storefront (restricted to SUPER_ADMIN or single-store for STORE_ADMIN)
export const createStore = (data: { name: string; slug: string }) =>
  client.post<ApiResponse<Store>, ApiResponse<Store>>('/stores', data);

// GET /stores - Fetches stores list (paginated). Tenant-isolated at backend.
export const getStores = (params?: { page?: number; limit?: number; search?: string }) =>
  client.get<ApiResponse<StoreListResponse>, ApiResponse<StoreListResponse>>('/stores', { params });

// GET /stores/stats - Fetch global dashboard store and user stats
export const getStoreStats = () =>
  client.get<ApiResponse<{ storesCount: number; usersCount: number }>, ApiResponse<any>>('/stores/stats');

// GET /stores/:id - Fetch storefront details. Tenant-isolated for STORE_ADMIN.
export const getStoreById = (id: string) =>
  client.get<ApiResponse<Store>, ApiResponse<Store>>(`/stores/${id}`);

// PUT /stores/:id - Modifies store metadata properties.
export const updateStore = (id: string, data: Partial<{ name: string; slug: string; isActive: boolean }>) =>
  client.put<ApiResponse<Store>, ApiResponse<Store>>(`/stores/${id}`, data);

// DELETE /stores/:id - Destroys storefront database record (restricted to SUPER_ADMIN)
export const deleteStore = (id: string) =>
  client.delete<ApiResponse<null>, ApiResponse<null>>(`/stores/${id}`);
