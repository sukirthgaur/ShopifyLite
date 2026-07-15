import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Public Storefront Module Services
 * Handles lookup for the public storefront without any authentication.
 */

export const getStorefrontBySlug = async (slug: string) => {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      categories: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      },
      products: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          categoryId: true,
          stock: true,
        },
      },
    },
  });

  // If store does not exist or has been deactivated by Super Admin, return 404.
  if (!store || !store.isActive) {
    throw new ApiError(404, 'Storefront offline or not found.');
  }

  return {
    storeName: store.name,
    categories: store.categories,
    products: store.products,
  };
};

