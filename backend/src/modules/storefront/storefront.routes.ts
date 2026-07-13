import { Router } from 'express';
import * as storefrontController from './storefront.controller.js';

const router = Router();

/**
 * Public Storefront Routing Definition
 * Accessible without authentication.
 */

router.get('/:slug', storefrontController.getStorefront);

export default router;
