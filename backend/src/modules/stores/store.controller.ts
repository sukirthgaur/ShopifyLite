import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createStoreSchema, updateStoreSchema } from './store.schema.js';
import * as storeService from './store.service.js';
import { parsePagination } from '../../utils/pagination.js';

/**
 * Stores Module Controllers
 * Processes store creation, listings, lookups, updates, and deletes.
 */

// POST /stores - Create a new storefront
export const createStore = asyncHandler(async (req: Request, res: Response) => {
  const data = createStoreSchema.parse(req.body);
  const store = await storeService.createStore(data, req.user!);
  res.status(201).json(new ApiResponse(true, 'Store created successfully', store));
});

// GET /stores - Fetches stores (paginated). Tenant-isolated for STORE_ADMIN.
export const getStores = asyncHandler(async (req: Request, res: Response) => {
  // Parse pagination params (?page=1&limit=10) from request query
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const result = await storeService.getStores(req.user!, pagination);
  res.status(200).json(new ApiResponse(true, 'Stores retrieved successfully', result));
});

// GET /stores/stats - Fetch high level dashboard count statistics
export const getStoreStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await storeService.getStoreStats(req.user!);
  res.status(200).json(new ApiResponse(true, 'Store stats retrieved successfully', stats));
});

// GET /stores/:id - Fetch storefront details. Tenant-isolated for STORE_ADMIN.
export const getStoreById = asyncHandler(async (req: Request, res: Response) => {
  const store = await storeService.getStoreById(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'Store retrieved successfully', store));
});

// PUT /stores/:id - Modifies store metadata properties.
export const updateStore = asyncHandler(async (req: Request, res: Response) => {
  const data = updateStoreSchema.parse(req.body);
  const store = await storeService.updateStore(req.params.id as string, data, req.user!);
  res.status(200).json(new ApiResponse(true, 'Store updated successfully', store));
});

// DELETE /stores/:id - Destroys storefront database record (restricted to SUPER_ADMIN)
export const deleteStore = asyncHandler(async (req: Request, res: Response) => {
  const store = await storeService.deleteStore(req.params.id as string);
  res.status(200).json(new ApiResponse(true, 'Store deleted successfully', store));
});
