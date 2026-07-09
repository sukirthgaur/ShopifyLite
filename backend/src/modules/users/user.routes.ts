import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.post('/', authenticate, requireRole('SUPER_ADMIN'), userController.createUser);
router.get('/', authenticate, userController.getUsers);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), userController.deleteUser);

export default router;
