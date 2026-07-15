import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

/**
 * Categories Module Routing Definitions
 * All routes are guarded by authenticate and require STORE_ADMIN role.
 */

router.use(authenticate);
router.use(requireRole('STORE_ADMIN'));

router.post('/', categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
