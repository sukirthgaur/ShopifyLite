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
    update: {},
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
    update: {},
    create: {
      name: 'Beta Admin',
      email: 'beta@demo.com',
      password: betaAdminPassword,
      role: Role.STORE_ADMIN,
      storeId: storeBeta.id, // Linking user relation to Store Beta
    },
  });

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
