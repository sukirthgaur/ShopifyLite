import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Database Singleton
 * This exports a single, globally shared instance of PrismaClient.
 * Reusing a single instance prevents opening excessive socket connections to our PostgreSQL database,
 * which can exhaust database connection pools.
 */
const prisma = new PrismaClient();

export default prisma;
