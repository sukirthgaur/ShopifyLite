import client from './client';
import type { ApiResponse, LoginResponse, User } from '../types';

export const login = (email: string, password: string, storeSlug?: string) =>
  client.post<ApiResponse<LoginResponse>, ApiResponse<LoginResponse>>('/auth/login', { email, password, storeSlug });

export const register = (name: string, email: string, password: string, role?: string, storeSlug?: string) =>
  client.post<ApiResponse<LoginResponse>, ApiResponse<LoginResponse>>('/auth/register', { name, email, password, role, storeSlug });

export const getProfile = () =>
  client.get<ApiResponse<User>, ApiResponse<User>>('/auth/profile');
