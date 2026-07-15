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
  const files = (req.files as Express.Multer.File[]) || [];
  const localUrls = files.map(file => `/uploads/${file.filename}`);

  let existingImages: string[] = [];
  if (req.body.existingImages) {
    existingImages = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : [req.body.existingImages];
  }

  const combinedImages = [...existingImages, ...localUrls];

  const formattedData = {
    name: req.body.name,
    price: req.body.price ? Number(req.body.price) : undefined,
    stock: req.body.stock ? Number(req.body.stock) : undefined,
    categoryId: req.body.categoryId === '' || req.body.categoryId === 'null' || req.body.categoryId === 'undefined' ? null : req.body.categoryId,
    images: combinedImages,
  };

  const data = createProductSchema.parse(formattedData);
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
  const files = (req.files as Express.Multer.File[]) || [];
  const localUrls = files.map(file => `/uploads/${file.filename}`);

  let existingImages: string[] = [];
  if (req.body.existingImages) {
    existingImages = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : [req.body.existingImages];
  }

  const combinedImages = [...existingImages, ...localUrls];

  const formattedData: Record<string, any> = {
    name: req.body.name,
    price: req.body.price ? Number(req.body.price) : undefined,
    stock: req.body.stock ? Number(req.body.stock) : undefined,
    isActive: req.body.isActive === 'true' ? true : req.body.isActive === 'false' ? false : undefined,
    categoryId: req.body.categoryId === '' || req.body.categoryId === 'null' || req.body.categoryId === 'undefined' ? null : req.body.categoryId,
  };

  // If the frontend passed existingImages OR there are new files uploaded, update the images array
  if (req.body.existingImages !== undefined || files.length > 0) {
    formattedData.images = combinedImages;
  }

  const data = updateProductSchema.parse(formattedData);
  const product = await productService.updateProduct(req.params.id as string, data, req.user!);
  res.status(200).json(new ApiResponse(true, 'Product updated successfully', product));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.deleteProduct(req.params.id as string, req.user!);
  res.status(200).json(new ApiResponse(true, 'Product deleted successfully', product));
});
