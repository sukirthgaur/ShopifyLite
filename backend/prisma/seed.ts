import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize the Prisma Client instance to interact with the database
const prisma = new PrismaClient();

// Work factor for bcrypt hashing (higher is more secure, but slower)
const SALT_ROUNDS = 10;

/**
 * Main seeding function.
 * We clean the database first, then insert initial data.
 */
async function main() {
  // Clean up all existing dynamic data to handle breaking schema changes and prevent compound constraint failures
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // 1. Create a default Super Admin user account (who oversees all stores and merchants)
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'superadmin@shopifylite.com' },
    update: {}, // If the user exists, do not modify their properties
    create: {
      name: 'Super Admin',
      email: 'superadmin@shopifylite.com',
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Create Store 1: Demo Store Alpha (sample e-commerce store tenant)
  const storeAlpha = await prisma.store.upsert({
    where: { slug: 'demo-store-alpha' },
    update: {},
    create: {
      name: 'Demo Store Alpha',
      slug: 'demo-store-alpha',
    },
  });

  // 3. Create a Store Admin user assigned specifically to Demo Store Alpha
  const alphaAdminPassword = await bcrypt.hash('StoreAdmin123!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'alpha@demo.com' },
    update: {
      storeId: storeAlpha.id, // Ensure link is intact
    },
    create: {
      name: 'Alpha Admin',
      email: 'alpha@demo.com',
      password: alphaAdminPassword,
      role: Role.STORE_ADMIN,
      storeId: storeAlpha.id, // Linking user relation to Store Alpha
    },
  });

  // 4. Create Store 2: Demo Store Beta (second sample storefront tenant)
  const storeBeta = await prisma.store.upsert({
    where: { slug: 'demo-store-beta' },
    update: {},
    create: {
      name: 'Demo Store Beta',
      slug: 'demo-store-beta',
    },
  });

  // 5. Create a Store Admin user assigned specifically to Demo Store Beta
  const betaAdminPassword = await bcrypt.hash('StoreAdmin123!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'beta@demo.com' },
    update: {
      storeId: storeBeta.id, // Ensure link is intact
    },
    create: {
      name: 'Beta Admin',
      email: 'beta@demo.com',
      password: betaAdminPassword,
      role: Role.STORE_ADMIN,
      storeId: storeBeta.id, // Linking user relation to Store Beta
    },
  });

  // 6. Create Categories for both stores
  const alphaCategory1 = await prisma.category.create({
    data: {
      storeId: storeAlpha.id,
      name: 'Apparel',
      isActive: true,
    },
  });

  const alphaCategory2 = await prisma.category.create({
    data: {
      storeId: storeAlpha.id,
      name: 'Accessories',
      isActive: true,
    },
  });

  const betaCategory1 = await prisma.category.create({
    data: {
      storeId: storeBeta.id,
      name: 'Footwear',
      isActive: true,
    },
  });

  const betaCategory2 = await prisma.category.create({
    data: {
      storeId: storeBeta.id,
      name: 'Gear',
      isActive: true,
    },
  });

  // 7. Seed products for Store Alpha
  const alphaProducts = [
    {
      name: 'Alpha T-Shirt',
      price: 25.00,
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500',
      ],
      stock: 100,
      categoryId: alphaCategory1.id,
    },
    {
      name: 'Alpha Hoodie',
      price: 55.00,
      images: [
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500',
      ],
      stock: 50,
      categoryId: alphaCategory1.id,
    },
    {
      name: 'Alpha Mug',
      price: 15.00,
      images: [
        'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500',
        'https://images.unsplash.com/photo-1572119363156-23b1e8a93ac0?w=500',
      ],
      stock: 200,
      categoryId: alphaCategory2.id,
    },
  ];

  for (const prod of alphaProducts) {
    await prisma.product.create({
      data: {
        storeId: storeAlpha.id,
        categoryId: prod.categoryId,
        name: prod.name,
        price: prod.price,
        images: prod.images,
        stock: prod.stock,
      },
    });
  }

  // 8. Seed products for Store Beta
  const betaProducts = [
    {
      name: 'Beta Sneaker',
      price: 120.00,
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
      ],
      stock: 30,
      categoryId: betaCategory1.id,
    },
    {
      name: 'Beta Backpack',
      price: 80.00,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500',
      ],
      stock: 40,
      categoryId: betaCategory2.id,
    },
    {
      name: 'Beta Cap',
      price: 20.00,
      images: [
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
        'https://images.unsplash.com/photo-1534215754734-18e55d13ce3a?w=500',
      ],
      stock: 150,
      categoryId: betaCategory2.id,
    },
  ];

  for (const prod of betaProducts) {
    await prisma.product.create({
      data: {
        storeId: storeBeta.id,
        categoryId: prod.categoryId,
        name: prod.name,
        price: prod.price,
        images: prod.images,
        stock: prod.stock,
      },
    });
  }

  console.log('Seed completed successfully.');
}

// Execute the seeding logic
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect from the database when seeding finishes or crashes
    await prisma.$disconnect();
  });
