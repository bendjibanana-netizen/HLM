// Files d'attente (BullMQ sur Redis) : les traitements longs sortent des requêtes web
// et sont exécutés par le processus « worker » (npm run worker).
import "server-only";
import { Queue } from "bullmq";
import { env } from "@/lib/env";

/** Paramètres de connexion Redis, partagés par l'application et le worker. */
export function connexionRedis() {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    // Exigé par BullMQ pour les connexions bloquantes du worker.
    maxRetriesPerRequest: null,
  };
}

export const FILE_CHAPITRES = "chapitres";
export const FILE_SYNC = "synchronisation";
export const FILE_NOTIFICATIONS = "notifications";

export type TacheChapitre = { type: "traiter"; chapitreId: string } | { type: "publier-programmes" };

// En développement, le rechargement à chaud réévalue ce module : on conserve les files sur l'objet global.
const global = globalThis as unknown as { files?: Map<string, Queue> };
const files = (global.files ??= new Map());

export function file(nom: string): Queue {
  let existante = files.get(nom);
  if (!existante) {
    existante = new Queue(nom, {
      connection: connexionRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
      },
    });
    files.set(nom, existante);
  }
  return existante;
}

/** Demande au worker de traiter les planches d'un chapitre (découpage, déclinaisons AVIF/WebP). */
export async function demanderTraitementChapitre(chapitreId: string): Promise<void> {
  const tache: TacheChapitre = { type: "traiter", chapitreId };
  // jobId : deux demandes pour le même chapitre ne lancent pas deux traitements en parallèle.
  await file(FILE_CHAPITRES).add("traiter", tache, { jobId: `traiter-${chapitreId}-${Date.now()}` });
}
