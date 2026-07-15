import client from './client';
import type { ApiResponse, Category } from '../types';

/**
 * Categories Module API Client functions
 */

export const createCategory = (data: { name: string }) =>
  client.post<ApiResponse<Category>, ApiResponse<Category>>('/categories', data);

export const getCategories = () =>
  client.get<ApiResponse<Category[]>, ApiResponse<Category[]>>('/categories');

export const getCategoryById = (id: string) =>
  client.get<ApiResponse<Category>, ApiResponse<Category>>(`/categories/${id}`);

export const updateCategory = (id: string, data: Partial<{ name: string; isActive: boolean }>) =>
  client.put<ApiResponse<Category>, ApiResponse<Category>>(`/categories/${id}`, data);

export const deleteCategory = (id: string) =>
  client.delete<ApiResponse<null>, ApiResponse<null>>(`/categories/${id}`);
