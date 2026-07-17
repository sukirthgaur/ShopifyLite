import client from './client';
import type { ApiResponse, LoginResponse, User } from '../types';

export const login = (email: string, password: string) =>
  client.post<ApiResponse<LoginResponse>, ApiResponse<LoginResponse>>('/auth/login', { email, password });

export const register = (name: string, email: string, password: string, role?: string) =>
  client.post<ApiResponse<LoginResponse>, ApiResponse<LoginResponse>>('/auth/register', { name, email, password, role });

export const getProfile = () =>
  client.get<ApiResponse<User>, ApiResponse<User>>('/auth/profile');
