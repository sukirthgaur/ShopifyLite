import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import * as uploadService from './upload.service.js';

/**
 * Upload Module Controllers
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  // Check if multer has parsed the file and attached it to req.file
  if (!req.file) {
    throw new ApiError(400, 'Please select an image file to upload.');
  }

  const storeId = req.user?.storeId;
  if (!storeId) {
    throw new ApiError(400, 'You must have a store associated with your account to upload images.');
  }

  const result = await uploadService.uploadImageToCloudinary(req.file, storeId);
  
  res.status(200).json(new ApiResponse(true, 'Image uploaded successfully', result));
});
