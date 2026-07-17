import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { JwtPayload, PaginationQuery } from '../../types/index.js';
import { CreateOrderInput } from './order.schema.js';
import { OrderStatus } from '@prisma/client';

export const createOrder = async (data: CreateOrderInput, caller: JwtPayload) => {
  if (caller.role !== 'CUSTOMER') {
    throw new ApiError(403, 'Only customers can place orders.');
  }

  const { items } = data;

  // Use a Prisma transaction to ensure order placement and stock decrement are atomic
  return prisma.$transaction(async (tx) => {
    // 1. Get all products and check active states
    const productIds = items.map(item => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: { store: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    let storeId: string | null = null;
    let totalAmount = 0;
    const orderItemsData = [];

    // 2. Validate all items
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      if (!product.isActive) {
        throw new ApiError(400, `Product "${product.name}" is inactive`);
      }

      if (!product.store || !product.store.isActive) {
        throw new ApiError(400, `Store is offline or inactive for product "${product.name}"`);
      }

      // Check single-store scoping
      if (storeId === null) {
        storeId = product.storeId;
      } else if (storeId !== product.storeId) {
        throw new ApiError(400, 'All items in an order must belong to the same store.');
      }

      // Validate stock quantity
      if (item.quantity <= 0) {
        throw new ApiError(400, 'Quantity must be greater than zero');
      }

      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for product "${product.name}". Only ${product.stock} items available`);
      }

      // Calculate total amount and store order item details
      totalAmount += product.price * item.quantity;
      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        priceAtPurchase: product.price,
        quantity: item.quantity,
      });
    }

    if (!storeId) {
      throw new ApiError(400, 'No store items found');
    }

    // 3. Create the Order and its OrderItems
    const order = await tx.order.create({
      data: {
        storeId,
        customerId: caller.userId,
        totalAmount,
        status: OrderStatus.PENDING,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // 4. Decrement product stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  });
};

export const getOrders = async (caller: JwtPayload, pagination: PaginationQuery) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  let whereClause: any = {};

  if (caller.role === 'CUSTOMER') {
    whereClause.customerId = caller.userId;
  } else if (caller.role === 'STORE_ADMIN') {
    if (!caller.storeId) {
      throw new ApiError(400, 'You must be associated with a store to view orders.');
    }
    whereClause.storeId = caller.storeId;
  } else {
    throw new ApiError(403, 'Access denied. Invalid role for viewing orders.');
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({
      where: whereClause,
    }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrderById = async (id: string, caller: JwtPayload) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Tenant isolation/ownership check
  if (caller.role === 'CUSTOMER') {
    if (order.customerId !== caller.userId) {
      throw new ApiError(403, 'Access denied. You do not own this order.');
    }
  } else if (caller.role === 'STORE_ADMIN') {
    if (order.storeId !== caller.storeId) {
      throw new ApiError(403, 'Access denied. This order does not belong to your store.');
    }
  } else {
    throw new ApiError(403, 'Access denied. Invalid role.');
  }

  return order;
};

export const updateOrderStatus = async (id: string, status: OrderStatus, caller: JwtPayload) => {
  if (caller.role !== 'STORE_ADMIN') {
    throw new ApiError(403, 'Only store administrators can update order status.');
  }

  if (!caller.storeId) {
    throw new ApiError(400, 'You must be associated with a store to manage orders.');
  }

  // Check existence and ownership
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.storeId !== caller.storeId) {
    throw new ApiError(403, 'Access denied. This order does not belong to your store.');
  }

  return prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};
