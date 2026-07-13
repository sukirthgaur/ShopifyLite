import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize the Prisma Client instance to interact with the database
const prisma = new PrismaClient();

// Work factor for bcrypt hashing (higher is more secure, but slower)
const SALT_ROUNDS = 10;

/**
 * Main seeding function.
 * We use `upsert` queries to make the seed script idempotent.
 * This means we can run this script multiple times without duplicate record conflicts.
 */
async function main() {
  
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

  // 6. Seed products for Store Alpha
  const alphaProducts = [
    {
      name: 'Alpha T-Shirt',
      price: 25.00,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
      stock: 100,
    },
    {
      name: 'Alpha Hoodie',
      price: 55.00,
      imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
      stock: 50,
    },
    {
      name: 'Alpha Mug',
      price: 15.00,
      imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500',
      stock: 200,
    },
  ];

  for (const prod of alphaProducts) {
    const existing = await prisma.product.findFirst({
      where: { storeId: storeAlpha.id, name: prod.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          storeId: storeAlpha.id,
          name: prod.name,
          price: prod.price,
          imageUrl: prod.imageUrl,
          stock: prod.stock,
        },
      });
    }
  }

  // 7. Seed products for Store Beta
  const betaProducts = [
    {
      name: 'Beta Sneaker',
      price: 120.00,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      stock: 30,
    },
    {
      name: 'Beta Backpack',
      price: 80.00,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      stock: 40,
    },
    {
      name: 'Beta Cap',
      price: 20.00,
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
      stock: 150,
    },
  ];

  for (const prod of betaProducts) {
    const existing = await prisma.product.findFirst({
      where: { storeId: storeBeta.id, name: prod.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          storeId: storeBeta.id,
          name: prod.name,
          price: prod.price,
          imageUrl: prod.imageUrl,
          stock: prod.stock,
        },
      });
    }
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
