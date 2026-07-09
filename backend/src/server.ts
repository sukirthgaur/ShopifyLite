import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import storeRoutes from './modules/stores/store.routes.js';
import userRoutes from './modules/users/user.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_, res) => {
  res.json({ success: true, message: 'Shopify Lite API is running' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
