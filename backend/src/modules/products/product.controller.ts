import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createProductSchema, updateProductSchema } from './product.schema.js';
import * as productService from './product.service.js';
import { parsePagination } from '../../utils/pagination.js';

/**
 * Products Module Controllers
 */

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = createProductSchema.parse(req.body);
  const product = await productService.createProduct(data, req.user!);
  res.status(201).json(new ApiResponse(true, 'Product created successfully', product));
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const result = await productService.getProducts(req.user!, pagination);
  res.status(200).json(new ApiResponse(true, 'Products retrieved successfully', result));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'Product retrieved successfully', product));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = updateProductSchema.parse(req.body);
  const product = await productService.updateProduct(req.params.id as string, data, req.user!);
  res.status(200).json(new ApiResponse(true, 'Product updated successfully', product));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.deleteProduct(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'Product deleted successfully', product));
});
