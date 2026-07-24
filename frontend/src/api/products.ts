import client from './client';
import type { ApiResponse, Product, ProductListResponse } from '../types';

/**
 * Products Module API Client functions
 */

export const createProduct = (data: FormData) =>
  client.post<ApiResponse<Product>, ApiResponse<Product>>('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getProducts = (params?: { page?: number; limit?: number; categoryId?: string }) =>
  client.get<ApiResponse<ProductListResponse>, ApiResponse<ProductListResponse>>('/products', { params });

export const getProductStats = () =>
  client.get<ApiResponse<{ total: number; active: number; inactive: number }>, ApiResponse<any>>('/products/stats');

export const getProductById = (id: string) =>
  client.get<ApiResponse<Product>, ApiResponse<Product>>(`/products/${id}`);

export const updateProduct = (id: string, data: FormData) =>
  client.put<ApiResponse<Product>, ApiResponse<Product>>(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteProduct = (id: string) =>
  client.delete<ApiResponse<{ id: string }>, ApiResponse<null>>(`/products/${id}`);
