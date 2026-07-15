import cloudinary from '../../config/cloudinary.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Upload Service
 * Handles processing and uploading files to Cloudinary.
 */
export const uploadImageToCloudinary = async (
  file: Express.Multer.File,
  storeId: string
): Promise<{ url: string }> => {
  if (!storeId) {
    throw new ApiError(400, 'You must have a store associated with your account to upload images.');
  }

  try {
    // Convert binary buffer to base64 Data URI
    const base64Data = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64Data}`;

    // Upload to Cloudinary under the store's directory namespace
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: `shopify-lite/${storeId}`,
    });

    return { url: uploadResult.secure_url };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new ApiError(500, `Failed to upload image to storage: ${error.message || error}`);
  }
};
