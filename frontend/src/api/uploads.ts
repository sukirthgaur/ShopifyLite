import client from './client';
import type { ApiResponse } from '../types';

/**
 * Upload Service API calls
 */
export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  return client.post<ApiResponse<{ url: string }>, ApiResponse<{ url: string }>>(
    '/uploads/image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};
