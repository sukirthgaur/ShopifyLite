import { Router } from 'express';
import multer from 'multer';
import * as uploadController from './upload.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();

// Configure multer memory storage and constraints
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only JPEG, PNG, and WEBP images are allowed.'));
    }
  },
});

// Guard all upload endpoints with session authenticate + store manager roles
router.use(authenticate);
router.use(requireRole('STORE_ADMIN'));

// Route: POST /api/uploads/image
router.post('/image', upload.single('image'), uploadController.uploadImage);

export default router;
