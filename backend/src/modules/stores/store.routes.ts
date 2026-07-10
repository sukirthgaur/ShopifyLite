import { Router } from 'express';
import * as storeController from './store.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

/**
 * Stores Module Routing Definitions
 * Integrates tenant authentication guards and access controls.
 */

// Route to create a storefront. Both roles can create (with role restrictions handled inside service)
router.post('/', authenticate, storeController.createStore);

// Route to list stores. Tenant-isolated (STORE_ADMIN only retrieves their associated store)
router.get('/', authenticate, storeController.getStores);

// Route to get a specific storefront. Isolated at DB queries level.
router.get('/:id', authenticate, storeController.getStoreById);

// Route to modify store parameters.
router.put('/:id', authenticate, storeController.updateStore);

// Route to remove a storefront. Restricting access strictly to SUPER_ADMIN.
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), storeController.deleteStore);

export default router;
