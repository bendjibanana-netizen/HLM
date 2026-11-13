// Client Prisma unique pour toute l'application.
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

function creerClient(): PrismaClient {
  const adaptateur = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter: adaptateur });
}

// En développement, le rechargement à chaud réévalue ce module : on conserve
// l'instance sur l'objet global pour ne pas épuiser les connexions à la base.
const global = globalThis as unknown as { prisma?: PrismaClient };

export const db = global.prisma ?? creerClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
