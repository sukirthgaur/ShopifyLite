import client from './client';
import type { ApiResponse, OrderListResponse, Order, OrderStatus } from '../types';

export const placeOrder = (items: { productId: string; quantity: number }[]) =>
  client.post<ApiResponse<Order>, ApiResponse<Order>>('/orders', { items });

export const getOrders = (page: number = 1, limit: number = 10) =>
  client.get<ApiResponse<OrderListResponse>, ApiResponse<OrderListResponse>>(`/orders?page=${page}&limit=${limit}`);

export const updateOrderStatus = (orderId: string, status: OrderStatus) =>
  client.patch<ApiResponse<Order>, ApiResponse<Order>>(`/orders/${orderId}/status`, { status });
