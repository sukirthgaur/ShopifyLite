import client from './client';
import type { ApiResponse, User, UserListResponse } from '../types';

/**
 * Users Module API Client functions
 * These methods wrap endpoints using a customized Axios client instance.
 * We pass two type arguments to `client.post` / `client.get`:
 *   1st: The structure of the resolved response body data.
 *   2nd: The type returned inside standard error rejections.
 */

// POST /users - Creates a new user account (Restricted to SUPER_ADMIN on backend)
export const createUser = (data: { name: string; email: string; password: string; role: string; storeId?: string }) =>
  client.post<ApiResponse<User>, ApiResponse<User>>('/users', data);

// GET /users - Fetches paginated users. Tenant-isolated (STORE_ADMIN only retrieves their store's users)
export const getUsers = (params?: { page?: number; limit?: number; search?: string }) =>
  client.get<ApiResponse<UserListResponse>, ApiResponse<UserListResponse>>('/users', { params });

// GET /users/:id - Fetches a single user by ID. Isolates tenants at DB service layer.
export const getUserById = (id: string) =>
  client.get<ApiResponse<User>, ApiResponse<User>>(`/users/${id}`);

// PUT /users/:id - Updates user name, email, password, or system roles.
export const updateUser = (id: string, data: Partial<{ name: string; email: string; role: string; storeId: string }>) =>
  client.put<ApiResponse<User>, ApiResponse<User>>(`/users/${id}`, data);

// DELETE /users/:id - Permanently removes a user account (Restricted to SUPER_ADMIN)
export const deleteUser = (id: string) =>
  client.delete<ApiResponse<null>, ApiResponse<null>>(`/users/${id}`);

