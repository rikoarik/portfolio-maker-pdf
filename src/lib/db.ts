import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  pgSslForConnectionString,
  sanitizeConnectionStringForNodePg,
} from "@/lib/pg-ssl";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  dbUrl?: string;
};

function connectionUrl(): string {
  return sanitizeConnectionStringForNodePg(
    process.env.DATABASE_URL ??
      process.env.DIRECT_URL ??
      "postgresql://portfolio:portfolio@127.0.0.1:5432/portfolio",
  );
}

function createPrismaClient(url: string): PrismaClient {
  const ssl = pgSslForConnectionString(url);
  const pool = new Pool(
    ssl ? { connectionString: url, ssl } : { connectionString: url },
  );
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** Baca ulang DATABASE_URL (mis. setelah Next memuat .env baru di dev). */
export function getPrisma(): PrismaClient {
  const url = connectionUrl();
  if (globalForPrisma.prisma && globalForPrisma.dbUrl !== url) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.dbUrl = url;
    globalForPrisma.prisma = createPrismaClient(url);
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop as keyof PrismaClient);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
