/**
 * System Authority Roles
 * - `SUPER_ADMIN`: Access to all stores directory records and global operations.
 * - `STORE_ADMIN`: Tenant merchant restricted permissions.
 */
export type Role = 'SUPER_ADMIN' | 'STORE_ADMIN';

/**
 * User Account Model
 * Matches structure returned from backend.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId: string | null;
  store?: Store | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenant Store storefront Model
 */
export interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  admin?: User | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Store Product Model
 */
export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Standard Pagination Metadata Model
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic Unified API Response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Unified API Error structure
 */
export interface ApiError {
  success: false;
  message: string;
  errors: string[];
}

/**
 * Session Login Response Model
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Paginated Store storefront List response
 */
export interface StoreListResponse {
  stores: Store[];
  pagination: PaginationMeta;
}

/**
 * Paginated User Account List response
 */
export interface UserListResponse {
  users: User[];
  pagination: PaginationMeta;
}

/**
 * Paginated Product list response
 */
export interface ProductListResponse {
  products: Product[];
  pagination: PaginationMeta;
}

/**
 * Public Storefront response
 */
export interface StorefrontResponse {
  storeName: string;
  products: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  }[];
}
