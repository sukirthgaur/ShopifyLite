import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createOrderSchema, updateOrderStatusSchema } from './order.schema.js';
import * as orderService from './order.service.js';
import { parsePagination } from '../../utils/pagination.js';

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const data = createOrderSchema.parse(req.body);
  const result = await orderService.createOrder(data, req.user!);
  res.status(201).json(new ApiResponse(true, 'Order placed successfully', result));
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const result = await orderService.getOrders(req.user!, pagination);
  res.status(200).json(new ApiResponse(true, 'Orders retrieved successfully', result));
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const result = await orderService.getOrderById(orderId, req.user!);
  res.status(200).json(new ApiResponse(true, 'Order retrieved successfully', result));
});

export const patchOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const { status } = updateOrderStatusSchema.parse(req.body);
  const result = await orderService.updateOrderStatus(orderId, status, req.user!);
  res.status(200).json(new ApiResponse(true, 'Order status updated successfully', result));
});
