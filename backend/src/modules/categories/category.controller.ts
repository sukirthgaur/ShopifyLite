import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { createCategorySchema, updateCategorySchema } from './category.schema.js';
import * as categoryService from './category.service.js';

/**
 * Categories Module Controllers
 */

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = createCategorySchema.parse(req.body);
  const category = await categoryService.createCategory(data, req.user!);
  res.status(201).json(new ApiResponse(true, 'Category created successfully', category));
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.getCategories(req.user!);
  res.status(200).json(new ApiResponse(true, 'Categories retrieved successfully', categories));
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'Category retrieved successfully', category));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = updateCategorySchema.parse(req.body);
  const category = await categoryService.updateCategory(req.params.id as string, data, req.user!);
  res.status(200).json(new ApiResponse(true, 'Category updated successfully', category));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.deleteCategory(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'Category deleted successfully', category));
});
