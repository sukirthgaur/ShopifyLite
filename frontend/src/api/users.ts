import client from './client';
import type { ApiResponse, User, UserListResponse } from '../types';

export const createUser = (data: { name: string; email: string; password: string; role: string; storeId?: string }) =>
  client.post<ApiResponse<User>, ApiResponse<User>>('/users', data);

export const getUsers = (params?: { page?: number; limit?: number; search?: string }) =>
  client.get<ApiResponse<UserListResponse>, ApiResponse<UserListResponse>>('/users', { params });

export const getUserById = (id: string) =>
  client.get<ApiResponse<User>, ApiResponse<User>>(`/users/${id}`);

export const updateUser = (id: string, data: Partial<{ name: string; email: string; role: string; storeId: string }>) =>
  client.put<ApiResponse<User>, ApiResponse<User>>(`/users/${id}`, data);

export const deleteUser = (id: string) =>
  client.delete<ApiResponse<null>, ApiResponse<null>>(`/users/${id}`);
