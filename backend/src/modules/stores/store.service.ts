import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { JwtPayload, PaginationQuery } from '../../types/index.js';
import { CreateStoreInput, UpdateStoreInput } from './store.schema.js';

export const createStore = async (data: CreateStoreInput, caller: JwtPayload) => {
  // Check slug uniqueness
  const existingSlug = await prisma.store.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    throw new ApiError(409, 'A store with this slug already exists');
  }

  if (caller.role === 'STORE_ADMIN') {
    // STORE_ADMIN cannot create a second store
    if (caller.storeId) {
      throw new ApiError(409, 'You already have a store');
    }

    const store = await prisma.store.create({
      data: { name: data.name, slug: data.slug },
    });

    // Link the caller to the new store
    await prisma.user.update({
      where: { id: caller.userId },
      data: { storeId: store.id },
    });

    return store;
  }

  // SUPER_ADMIN flow
  const store = await prisma.store.create({
    data: { name: data.name, slug: data.slug },
  });

  // Optionally assign a user to the store
  if (data.userId) {
    await prisma.user.update({
      where: { id: data.userId },
      data: { storeId: store.id },
    });
  }

  return store;
};

export const getStores = async (caller: JwtPayload, pagination: PaginationQuery) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  if (caller.role === 'SUPER_ADMIN') {
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        skip,
        take: limit,
        include: { _count: { select: { users: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.store.count(),
    ]);

    return {
      stores,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // STORE_ADMIN: return only their store
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

export const getStoreById = async (storeId: string, caller: JwtPayload) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { users: { select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } } },
  });

  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  // Tenant isolation: STORE_ADMIN can only view their own store
  if (caller.role === 'STORE_ADMIN' && store.id !== caller.storeId) {
    throw new ApiError(403, 'Access denied. You can only view your own store.');
  }

  return store;
};

export const updateStore = async (storeId: string, data: UpdateStoreInput, caller: JwtPayload) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  // Tenant isolation
  if (caller.role === 'STORE_ADMIN') {
    if (store.id !== caller.storeId) {
      throw new ApiError(403, 'Access denied. You can only update your own store.');
    }
    // STORE_ADMIN cannot change active status
    const { isActive, ...allowedUpdates } = data;
    data = allowedUpdates;
  }

  // Check slug uniqueness if slug is changing
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

export const deleteStore = async (storeId: string) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  await prisma.store.delete({ where: { id: storeId } });
  return store;
};
