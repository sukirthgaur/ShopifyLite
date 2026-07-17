import { Router } from 'express';
import * as orderController from './order.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('CUSTOMER'), orderController.placeOrder);
router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:id/status', requireRole('STORE_ADMIN'), orderController.patchOrderStatus);

export default router;
