import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hasUsableDatabaseUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  if (!hasUsableDatabaseUrl()) {
    throw new Error("DATABASE_URL is missing or invalid.");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  });

  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

  globalForPrisma.prisma = prisma;

  return prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(getPrismaClient(), property, receiver);
    return typeof value === "function" ? value.bind(getPrismaClient()) : value;
  }
});
