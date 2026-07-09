export type Role = 'SUPER_ADMIN' | 'STORE_ADMIN';

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

export interface Store {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  users?: User[];
  _count?: { users: number };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors: string[];
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface StoreListResponse {
  stores: Store[];
  pagination: PaginationMeta;
}

export interface UserListResponse {
  users: User[];
  pagination: PaginationMeta;
}
