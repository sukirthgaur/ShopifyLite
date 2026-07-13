import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as storefrontService from './storefront.service.js';

/**
 * Public Storefront Module Controllers
 */

export const getStorefront = asyncHandler(async (req: Request, res: Response) => {
  const result = await storefrontService.getStorefrontBySlug(req.params.slug as string);
  res.status(200).json(new ApiResponse(true, 'Storefront retrieved successfully', result));
});
