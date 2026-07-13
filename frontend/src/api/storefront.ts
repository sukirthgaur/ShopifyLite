import axios from 'axios';
import type { ApiResponse, StorefrontResponse } from '../types';

/**
 * Public Storefront API Client functions
 * Note: This bypasses the authenticated Axios client so that no Authorization header is sent.
 */

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

publicClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || { message: 'Network error' })
);

export const getStorefront = (slug: string) =>
  publicClient.get<ApiResponse<StorefrontResponse>, ApiResponse<StorefrontResponse>>(`/storefront/${slug}`);
