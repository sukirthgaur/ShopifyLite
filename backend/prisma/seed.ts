import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'superadmin@shopifylite.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@shopifylite.com',
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  // Create Store 1: Demo Store Alpha
  const storeAlpha = await prisma.store.upsert({
    where: { slug: 'demo-store-alpha' },
    update: {},
    create: {
      name: 'Demo Store Alpha',
      slug: 'demo-store-alpha',
    },
  });

  const alphaAdminPassword = await bcrypt.hash('StoreAdmin123!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'alpha@demo.com' },
    update: {},
    create: {
      name: 'Alpha Admin',
      email: 'alpha@demo.com',
      password: alphaAdminPassword,
      role: Role.STORE_ADMIN,
      storeId: storeAlpha.id,
    },
  });

  // Create Store 2: Demo Store Beta
  const storeBeta = await prisma.store.upsert({
    where: { slug: 'demo-store-beta' },
    update: {},
    create: {
      name: 'Demo Store Beta',
      slug: 'demo-store-beta',
    },
  });

  const betaAdminPassword = await bcrypt.hash('StoreAdmin123!', SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: 'beta@demo.com' },
    update: {},
    create: {
      name: 'Beta Admin',
      email: 'beta@demo.com',
      password: betaAdminPassword,
      role: Role.STORE_ADMIN,
      storeId: storeBeta.id,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
