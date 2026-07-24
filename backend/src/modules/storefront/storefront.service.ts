import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Public Storefront Module Services
 * Handles lookup for the public storefront without any authentication.
 */

export const getStorefrontBySlug = async (
  slug: string,
  pagination?: { page: number; limit: number },
  filters?: { categoryId?: string }
) => {
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  // If store does not exist or has been deactivated by Super Admin, return 404.
  if (!store || !store.isActive) {
    throw new ApiError(404, 'Storefront offline or not found.');
  }

  const categoryWhere: any = { storeId: store.id, isActive: true };
  const productWhere: any = { storeId: store.id, isActive: true };

  if (filters?.categoryId && filters.categoryId !== 'all') {
    productWhere.categoryId = filters.categoryId;
  }

  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit || 50));
  const skip = (page - 1) * limit;

  const [categories, products, totalProducts] = await Promise.all([
    prisma.category.findMany({
      where: categoryWhere,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        categoryId: true,
        stock: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.product.count({
      where: productWhere,
    }),
  ]);

  return {
    storeName: store.name,
    categories,
    products,
    pagination: {
      page,
      limit,
      total: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
    },
  };
};

