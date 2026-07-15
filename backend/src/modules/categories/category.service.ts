import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { JwtPayload } from '../../types/index.js';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema.js';

/**
 * Categories Module Database Services
 * Implements strict tenant-isolation using the caller's storeId from JWT.
 */

export const createCategory = async (data: CreateCategoryInput, caller: JwtPayload) => {
  if (!caller.storeId) {
    throw new ApiError(400, 'You must have a store associated with your account to create categories.');
  }

  // Check unique category name per store
  const existing = await prisma.category.findUnique({
    where: {
      storeId_name: {
        storeId: caller.storeId!,
        name: data.name,
      },
    },
  });
  if (existing) {
    throw new ApiError(409, 'A category with this name already exists in your store.');
  }

  return prisma.category.create({
    data: {
      name: data.name,
      storeId: caller.storeId,
    },
  });
};

export const getCategories = async (caller: JwtPayload) => {
  if (!caller.storeId) {
    return [];
  }

  return prisma.category.findMany({
    where: { storeId: caller.storeId },
    orderBy: { name: 'asc' },
  });
};

export const getCategoryById = async (id: string, caller: JwtPayload) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Tenant isolation boundary check
  if (category.storeId !== caller.storeId) {
    throw new ApiError(403, 'Access denied. This category does not belong to your store.');
  }

  return category;
};

export const updateCategory = async (id: string, data: UpdateCategoryInput, caller: JwtPayload) => {
  const category = await getCategoryById(id, caller);

  // If changing name, ensure uniqueness
  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findUnique({
      where: {
        storeId_name: {
          storeId: caller.storeId!,
          name: data.name,
        },
      },
    });
    if (existing) {
      throw new ApiError(409, 'A category with this name already exists in your store.');
    }
  }

  // If setting isActive to false, cascade deactivate products in a transaction
  if (data.isActive === false && category.isActive !== false) {
    return prisma.$transaction(async (tx) => {
      const updatedCategory = await tx.category.update({
        where: { id },
        data,
      });

      await tx.product.updateMany({
        where: { categoryId: id },
        data: { isActive: false },
      });

      return updatedCategory;
    });
  }

  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string, caller: JwtPayload) => {
  // Verify existence and ownership first
  await getCategoryById(id, caller);

  return prisma.category.delete({
    where: { id },
  });
};
