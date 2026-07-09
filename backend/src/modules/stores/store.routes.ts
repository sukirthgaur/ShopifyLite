import { Router } from 'express';
import * as storeController from './store.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.post('/', authenticate, storeController.createStore);
router.get('/', authenticate, storeController.getStores);
router.get('/:id', authenticate, storeController.getStoreById);
router.put('/:id', authenticate, storeController.updateStore);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), storeController.deleteStore);

export default router;
