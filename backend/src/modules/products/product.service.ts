import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { JwtPayload, PaginationQuery } from '../../types/index.js';
import { CreateProductInput, UpdateProductInput } from './product.schema.js';

/**
 * Products Module Database Services
 * Implements strict tenant-isolation using the caller's storeId from JWT.
 */

export const createProduct = async (data: CreateProductInput, caller: JwtPayload) => {
  if (!caller.storeId) {
    throw new ApiError(400, 'You must have a store associated with your account to create products.');
  }

  // Tenant check on categoryId if provided
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category || category.storeId !== caller.storeId) {
      throw new ApiError(400, 'Invalid category for this store.');
    }
  }

  return prisma.product.create({
    data: {
      ...data,
      storeId: caller.storeId,
    },
  });
};

export const getProducts = async (caller: JwtPayload, pagination: PaginationQuery) => {
  if (!caller.storeId) {
    return {
      products: [],
      pagination: { page: 1, limit: pagination.limit, total: 0, totalPages: 0 },
    };
  }

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: caller.storeId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({
      where: { storeId: caller.storeId },
    }),
  ]);

  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getProductById = async (id: string, caller: JwtPayload) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Tenant isolation boundary check
  if (product.storeId !== caller.storeId) {
    throw new ApiError(403, 'Access denied. This product does not belong to your store.');
  }

  return product;
};

export const updateProduct = async (id: string, data: UpdateProductInput, caller: JwtPayload) => {
  // Verify existence and ownership first
  await getProductById(id, caller);

  // Tenant check on categoryId if provided
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category || category.storeId !== caller.storeId) {
      throw new ApiError(400, 'Invalid category for this store.');
    }
  }

  return prisma.product.update({
    where: { id },
    data,
  });
};

export const deleteProduct = async (id: string, caller: JwtPayload) => {
  // Verify existence and ownership first
  await getProductById(id, caller);

  return prisma.product.delete({
    where: { id },
  });
};

