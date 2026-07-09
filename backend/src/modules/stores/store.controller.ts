import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createStoreSchema, updateStoreSchema } from './store.schema.js';
import * as storeService from './store.service.js';
import { parsePagination } from '../../utils/pagination.js';

export const createStore = asyncHandler(async (req: Request, res: Response) => {
  const data = createStoreSchema.parse(req.body);
  const store = await storeService.createStore(data, req.user!);
  res.status(201).json(new ApiResponse(true, 'Store created successfully', store));
});

export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const result = await storeService.getStores(req.user!, pagination);
  res.status(200).json(new ApiResponse(true, 'Stores retrieved successfully', result));
});

export const getStoreById = asyncHandler(async (req: Request, res: Response) => {
  const store = await storeService.getStoreById(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'Store retrieved successfully', store));
});

export const updateStore = asyncHandler(async (req: Request, res: Response) => {
  const data = updateStoreSchema.parse(req.body);
  const store = await storeService.updateStore(req.params.id as string, data, req.user!);
  res.status(200).json(new ApiResponse(true, 'Store updated successfully', store));
});

export const deleteStore = asyncHandler(async (req: Request, res: Response) => {
  const store = await storeService.deleteStore(req.params.id as string);
  res.status(200).json(new ApiResponse(true, 'Store deleted successfully', store));
});
