import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * Authentication Module Routing Definitions
 * Maps specific endpoints to controller handlers.
 */

// Route to register a new merchant storefront owner (defaults to STORE_ADMIN)
router.post('/register', authController.register);

// Route to verify credentials and return JWT session token
router.post('/login', authController.login);

// Protected route to fetch profile attributes of the currently logged in user
router.get('/profile', authenticate, authController.getProfile);

export default router;
