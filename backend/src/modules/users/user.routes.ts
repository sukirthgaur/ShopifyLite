import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

/**
 * Users Module Routing Definitions
 * Includes guards for roles and authentication.
 */

// Route to register a user. Restricted entirely to SUPER_ADMIN.
router.post('/', authenticate, requireRole('SUPER_ADMIN'), userController.createUser);

// Route to retrieve users list. Isolated per merchant store inside database query.
router.get('/', authenticate, requireRole('SUPER_ADMIN', 'STORE_ADMIN'), userController.getUsers);

// Route to retrieve a single user profile.
router.get('/:id', authenticate, userController.getUserById);

// Route to modify user properties.
router.put('/:id', authenticate, userController.updateUser);

// Route to remove a user database record. Restricted to SUPER_ADMIN.
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN'), userController.deleteUser);

export default router;
