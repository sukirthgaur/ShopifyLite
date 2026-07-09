import client from './client';
import type { ApiResponse, Store, StoreListResponse } from '../types';

export const createStore = (data: { name: string; slug: string }) =>
  client.post<ApiResponse<Store>, ApiResponse<Store>>('/stores', data);

export const getStores = (params?: { page?: number; limit?: number; search?: string }) =>
  client.get<ApiResponse<StoreListResponse>, ApiResponse<StoreListResponse>>('/stores', { params });

export const getStoreById = (id: string) =>
  client.get<ApiResponse<Store>, ApiResponse<Store>>(`/stores/${id}`);

export const updateStore = (id: string, data: Partial<{ name: string; slug: string; isActive: boolean }>) =>
  client.put<ApiResponse<Store>, ApiResponse<Store>>(`/stores/${id}`, data);

export const deleteStore = (id: string) =>
  client.delete<ApiResponse<null>, ApiResponse<null>>(`/stores/${id}`);
