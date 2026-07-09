import prisma from '../../config/db.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { User } from '@prisma/client';

// Strip password from user object before returning
const excludePassword = <T extends { password: string }>(user: T): Omit<T, 'password'> => {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const register = async (data: RegisterInput) => {
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
      role: 'STORE_ADMIN',
    },
  });

  return excludePassword(user);
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signToken({
    userId: user.id,
    role: user.role,
    storeId: user.storeId,
  });

  return { user: excludePassword(user), token };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return excludePassword(user);
};
