// Connexion Redis de l'application (dédoublonnage des vues, limites de débit).
import "server-only";
import Redis from "ioredis";
import { env } from "@/lib/env";

const global = globalThis as unknown as { redis?: Redis };
export const redis = (global.redis ??= new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false }));
