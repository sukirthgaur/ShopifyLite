import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import storeRoutes from './modules/stores/store.routes.js';
import userRoutes from './modules/users/user.routes.js';
import productRoutes from './modules/products/product.routes.js';
import storefrontRoutes from './modules/storefront/storefront.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

// Initialize the Express application
const app = express();

/**
 * Configure Cross-Origin Resource Sharing (CORS)
 * This allows our frontend application (running on a different port/domain) to securely request resources from our API.
 * We enable 'credentials: true' so HTTP cookies and authorization headers are allowed to be passed.
 */
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

/**
 * Built-in Express middleware to parse incoming requests with JSON payloads.
 * This populates `req.body` with the parsed JSON data.
 */
app.use(express.json());

/**
 * Modularized Route Definitions
 * Each module (Auth, Stores, Users) defines its own endpoints, which are mounted under prefix paths.
 */
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/categories', categoryRoutes);


// Basic health check endpoint to verify server status
app.get('/api/health', (_, res) => {
  res.json({ success: true, message: 'Shopify Lite API is running' });
});

/**
 * Global Centralized Error Handler Middleware
 * This catches any errors thrown inside async request handlers (via asyncHandler) or standard routes
 * and formats them into a unified JSON response.
 * MUST be defined after all route mappings.
 */
app.use(errorHandler);

// Start listening for incoming HTTP traffic
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
