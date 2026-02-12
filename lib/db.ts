import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  _prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (globalForPrisma._prisma) return globalForPrisma._prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  globalForPrisma._prisma = client;
  return client;
}

// Lazy proxy: Prisma client is created on first property access, not at import time.
// This prevents build failures when DATABASE_URL isn't available during `next build`.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getClient()[prop as keyof PrismaClient];
  },
});
