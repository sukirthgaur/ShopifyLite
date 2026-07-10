import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { JwtPayload, PaginationQuery } from '../../types/index.js';
import { CreateStoreInput, UpdateStoreInput } from './store.schema.js';

/**
 * Stores Module Database Services
 * Executes database operations with strict tenant boundary checks.
 */

/**
 * Creates a new store storefront in the database.
 * Ensures the slug url handles are unique.
 * For STORE_ADMIN, registers the store, and links the calling user account to the store.
 */
export const createStore = async (data: CreateStoreInput, caller: JwtPayload) => {
  // Ensure slug uniqueness
  const existingSlug = await prisma.store.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    throw new ApiError(409, 'A store with this slug already exists');
  }

  // STORE_ADMIN limit: A merchant account can only manage/create a single store.
  if (caller.role === 'STORE_ADMIN') {
    if (caller.storeId) {
      throw new ApiError(409, 'You already have a store');
    }

    const store = await prisma.store.create({
      data: { name: data.name, slug: data.slug },
    });

    // Link the caller user to the newly registered store
    await prisma.user.update({
      where: { id: caller.userId },
      data: { storeId: store.id },
    });

    return store;
  }

  // SUPER_ADMIN flow: Can create multiple storefronts and optional link users
  const store = await prisma.store.create({
    data: { name: data.name, slug: data.slug },
  });

  // Assign user to store if userId parameter is provided in query
  if (data.userId) {
    await prisma.user.update({
      where: { id: data.userId },
      data: { storeId: store.id },
    });
  }

  return store;
};

/**
 * Fetches list of stores.
 * - SUPER_ADMIN: returns all global stores with pagination metadata.
 * - STORE_ADMIN: returns only their single associated store.
 */
export const getStores = async (caller: JwtPayload, pagination: PaginationQuery) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  if (caller.role === 'SUPER_ADMIN') {
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        skip,
        take: limit,
        include: { _count: { select: { users: true } } }, // Fetch count of users assigned to store
        orderBy: { createdAt: 'desc' },
      }),
      prisma.store.count(),
    ]);

    return {
      stores,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // STORE_ADMIN: return only their associated store
  if (!caller.storeId) {
    return {
      stores: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
    };
  }

  const store = await prisma.store.findUnique({
    where: { id: caller.storeId },
    include: { _count: { select: { users: true } } },
  });

  return {
    stores: store ? [store] : [],
    pagination: { page: 1, limit, total: store ? 1 : 0, totalPages: store ? 1 : 0 },
  };
};

/**
 * Fetches a single store by ID.
 * Implements strict tenant isolation for STORE_ADMIN.
 */
export const getStoreById = async (storeId: string, caller: JwtPayload) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { users: { select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } } },
  });

  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  // Tenant isolation: STORE_ADMIN can only view details of their own store
  if (caller.role === 'STORE_ADMIN' && store.id !== caller.storeId) {
    throw new ApiError(403, 'Access denied. You can only view your own store.');
  }

  return store;
};

/**
 * Updates store details.
 * Implements strict tenant isolation checks.
 */
export const updateStore = async (storeId: string, data: UpdateStoreInput, caller: JwtPayload) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  // Tenant isolation for STORE_ADMIN
  if (caller.role === 'STORE_ADMIN') {
    if (store.id !== caller.storeId) {
      throw new ApiError(403, 'Access denied. You can only update your own store.');
    }
    // STORE_ADMIN cannot change the active/inactive status of their store
    const { isActive, ...allowedUpdates } = data;
    data = allowedUpdates;
  }

  // Check unique slug URL handle uniqueness if modified
  if (data.slug && data.slug !== store.slug) {
    const existing = await prisma.store.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ApiError(409, 'A store with this slug already exists');
    }
  }

  const updated = await prisma.store.update({
    where: { id: storeId },
    data,
  });

  return updated;
};

/**
 * Deletes a store by ID (restricted to SUPER_ADMIN)
 */
export const deleteStore = async (storeId: string) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  await prisma.store.delete({ where: { id: storeId } });
  return store;
};
