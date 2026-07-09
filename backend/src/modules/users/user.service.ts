import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword } from '../../utils/password.js';
import { JwtPayload, PaginationQuery } from '../../types/index.js';
import { CreateUserInput, UpdateUserInput } from './user.schema.js';

// Strip password from user objects before returning
const excludePassword = <T extends { password: string }>(user: T): Omit<T, 'password'> => {
  const { password: _, ...rest } = user;
  return rest;
};

export const createUser = async (data: CreateUserInput) => {
  // Only SUPER_ADMIN can call this (enforced at route level)
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'STORE_ADMIN',
      storeId: data.storeId || null,
    },
  });

  return excludePassword(user);
};

export const getUsers = async (caller: JwtPayload, pagination: PaginationQuery) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build the where clause based on caller's role
  const where = caller.role === 'SUPER_ADMIN' ? {} : { storeId: caller.storeId };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        storeId: true,
        store: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserById = async (userId: string, caller: JwtPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Tenant isolation: STORE_ADMIN can only view users in their store
  if (caller.role === 'STORE_ADMIN' && user.storeId !== caller.storeId) {
    throw new ApiError(403, 'Access denied. You can only view users in your store.');
  }

  return excludePassword(user);
};

export const updateUser = async (userId: string, data: UpdateUserInput, caller: JwtPayload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Tenant isolation for STORE_ADMIN
  if (caller.role === 'STORE_ADMIN') {
    // Can edit own profile or users in their store
    const isSelf = userId === caller.userId;
    const isSameStore = user.storeId === caller.storeId;

    if (!isSelf && !isSameStore) {
      throw new ApiError(403, 'Access denied. You can only update users in your store.');
    }

    // STORE_ADMIN cannot change roles
    if (data.role) {
      throw new ApiError(403, 'Access denied. You cannot change user roles.');
    }
  }

  // Check email uniqueness if email is changing
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ApiError(409, 'A user with this email already exists');
    }
  }

  // Hash password if being updated
  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return excludePassword(updated);
};

export const deleteUser = async (userId: string) => {
  // Only SUPER_ADMIN can call this (enforced at route level)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await prisma.user.delete({ where: { id: userId } });
  return excludePassword(user);
};
