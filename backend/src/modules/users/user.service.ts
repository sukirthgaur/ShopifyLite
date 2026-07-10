import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword } from '../../utils/password.js';
import { JwtPayload, PaginationQuery } from '../../types/index.js';
import { CreateUserInput, UpdateUserInput } from './user.schema.js';

/**
 * Users Module Database Services
 * Manages user accounts and handles tenant-isolation validation checks.
 */

/**
 * Strips password hashes from returned user data objects to prevent credentials leakage.
 */
const excludePassword = <T extends { password: string }>(user: T): Omit<T, 'password'> => {
  const { password: _, ...rest } = user;
  return rest;
};

/**
 * Inserts a new user record into the database (restricted to SUPER_ADMIN on routes).
 */
export const createUser = async (data: CreateUserInput) => {
  // Ensure the email address is unique
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  // Encrypt user password
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

/**
 * Fetches user accounts with pagination.
 * - SUPER_ADMIN: returns all global users.
 * - STORE_ADMIN: returns only users assigned to their store (`storeId` match).
 */
export const getUsers = async (caller: JwtPayload, pagination: PaginationQuery) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build filter query based on user's authorization role
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
        store: true, // Fetch joined store parameters
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

/**
 * Fetches a single user by ID.
 * Enforces tenant boundary checks.
 */
export const getUserById = async (userId: string, caller: JwtPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Tenant isolation: STORE_ADMIN can only view users inside their same store
  if (caller.role === 'STORE_ADMIN' && user.storeId !== caller.storeId) {
    throw new ApiError(403, 'Access denied. You can only view users in your store.');
  }

  return excludePassword(user);
};

/**
 * Modifies user properties (name, email, password, role, store mapping).
 * Handles access controls and tenant limits.
 */
export const updateUser = async (userId: string, data: UpdateUserInput, caller: JwtPayload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Tenant isolation controls for STORE_ADMIN
  if (caller.role === 'STORE_ADMIN') {
    const isSelf = userId === caller.userId;
    const isSameStore = user.storeId === caller.storeId;

    // Can only edit their own profile or other team members in their same store storefront
    if (!isSelf && !isSameStore) {
      throw new ApiError(403, 'Access denied. You can only update users in your store.');
    }

    // STORE_ADMIN is forbidden from changing system role authority levels
    if (data.role) {
      throw new ApiError(403, 'Access denied. You cannot change user roles.');
    }
  }

  // Ensure email uniqueness if email address is modified
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ApiError(409, 'A user with this email already exists');
    }
  }

  const updateData: Record<string, unknown> = { ...data };
  
  // Encrypt the password before saving if it is updated
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return excludePassword(updated);
};

/**
 * Deletes a user from the database (restricted to SUPER_ADMIN).
 */
export const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await prisma.user.delete({ where: { id: userId } });
  return excludePassword(user);
};
