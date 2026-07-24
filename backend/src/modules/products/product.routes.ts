import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();

// Ensure the local uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure local disk storage for Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
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

/**
 * Products Module Routing Definitions
 * All routes are guarded by authenticate and require STORE_ADMIN role.
 */

router.use(authenticate);
router.use(requireRole('STORE_ADMIN'));

router.post('/', upload.array('images', 10), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/stats', productController.getProductStats);
router.get('/:id', productController.getProductById);
router.put('/:id', upload.array('images', 10), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
