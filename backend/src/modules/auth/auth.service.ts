import prisma from '../../config/db.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

/**
 * Helper function to strip sensitive password hashes from returned user data objects.
 * Prevents accidentally leaking secure hashes inside HTTP responses.
 */
const excludePassword = <T extends { password: string }>(user: T): Omit<T, 'password'> => {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Register merchant user account.
 * Checks for email conflicts, hashes the password, and inserts into DB.
 */
export const register = async (data: RegisterInput) => {
  // Check uniqueness of the email address
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  // Hash plain text password for database storage
  const hashedPassword = await hashPassword(data.password);

  // Insert user account with default STORE_ADMIN role
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

/**
 * Validates credentials and generates session token.
 */
export const login = async (data: LoginInput) => {
  // Fetch user by email
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new ApiError(404, 'No account found with this email');
  }

  // Validate password attempt against stored hashed password
  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Encode User UID, role permission, and associated Store UID into signed JWT token
  const token = signToken({
    userId: user.id,
    role: user.role,
    storeId: user.storeId,
  });

  return { user: excludePassword(user), token };
};

/**
 * Returns full profile properties of a user, including associated store metadata.
 */
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true }, // Join query to fetch linked tenant storefront details
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return excludePassword(user);
};
