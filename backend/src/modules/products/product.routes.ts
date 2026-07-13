import { Router } from 'express';
import * as productController from './product.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

/**
 * Products Module Routing Definitions
 * All routes are guarded by authenticate and require STORE_ADMIN role.
 */

router.use(authenticate);
router.use(requireRole('STORE_ADMIN'));

router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
