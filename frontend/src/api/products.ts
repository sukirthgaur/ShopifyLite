import client from './client';
import type { ApiResponse, Product, ProductListResponse } from '../types';

/**
 * Products Module API Client functions
 */

export const createProduct = (data: { name: string; price: number; imageUrl: string; stock: number }) =>
  client.post<ApiResponse<Product>, ApiResponse<Product>>('/products', data);

export const getProducts = (params?: { page?: number; limit?: number }) =>
  client.get<ApiResponse<ProductListResponse>, ApiResponse<ProductListResponse>>('/products', { params });

export const getProductById = (id: string) =>
  client.get<ApiResponse<Product>, ApiResponse<Product>>(`/products/${id}`);

export const updateProduct = (id: string, data: Partial<{ name: string; price: number; imageUrl: string; stock: number }>) =>
  client.put<ApiResponse<Product>, ApiResponse<Product>>(`/products/${id}`, data);

export const deleteProduct = (id: string) =>
  client.delete<ApiResponse<null>, ApiResponse<null>>(`/products/${id}`);
