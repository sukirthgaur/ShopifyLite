import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as storefrontService from './storefront.service.js';

/**
 * Public Storefront Module Controllers
 */

import { parsePagination } from '../../utils/pagination.js';

export const getStorefront = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const filters = {
    categoryId: req.query.categoryId as string | undefined,
  };
  const result = await storefrontService.getStorefrontBySlug(
    req.params.slug as string,
    pagination,
    filters
  );
  
  // Set cache header for public storefront queries
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.status(200).json(new ApiResponse(true, 'Storefront retrieved successfully', result));
});
