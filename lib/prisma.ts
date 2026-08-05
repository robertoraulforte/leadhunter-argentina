import { PrismaClient } from "../app/generated/prisma/client";

// Tipamos la clase constructora y la instancia de forma segura sin usar 'any'
type PrismaClientConstructor = new (options?: Record<string, unknown>) => InstanceType<typeof PrismaClient>;

const ClientClass = PrismaClient as unknown as PrismaClientConstructor;

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? new ClientClass();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}