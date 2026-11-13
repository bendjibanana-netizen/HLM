// Comptage des vues de chapitres : dédoublonné et protégé contre les robots.
//  - une vue par lecteur (ou appareil) et par chapitre toutes les 24 heures ;
//  - la page délivre un jeton signé : la vue n'est acceptée que s'il a au moins quelques secondes
//    (un robot qui enchaîne les requêtes sans lire n'est pas compté) ;
//  - les robots déclarés et les débits anormaux sont écartés.
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { redis } from "@/lib/redis";

const DUREE_MIN_LECTURE_MS = 5000;
const VALIDITE_JETON_MS = 6 * 60 * 60 * 1000;
const PERIODE_DEDOUBLONNAGE_S = 24 * 60 * 60;
const VUES_MAX_PAR_HEURE = 60;
export const MOTIF_ROBOT = /bot|crawl|spider|slurp|headless|phantom|curl|wget|python|scrapy|httpclient|lighthouse|preview/i;

const signer = (texte: string) => createHmac("sha256", `vues:${env.BETTER_AUTH_SECRET}`).update(texte).digest("base64url");

/** Jeton remis avec la page du chapitre : « <horodatage>.<signature> ». */
export function creerJetonVue(chapitreId: string, maintenant = Date.now()): string {
  return `${maintenant}.${signer(`${chapitreId}.${maintenant}`)}`;
}

/** Vérifie la signature du jeton et que le lecteur a passé assez de temps sur la page. */
export function verifierJetonVue(chapitreId: string, jeton: string, maintenant = Date.now()): boolean {
  const [horodatage, signature] = jeton.split(".");
  const emis = Number(horodatage);
  if (!signature || !Number.isFinite(emis)) return false;
  const attendue = Buffer.from(signer(`${chapitreId}.${emis}`));
  const recue = Buffer.from(signature);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return false;
  const age = maintenant - emis;
  return age >= DUREE_MIN_LECTURE_MS && age <= VALIDITE_JETON_MS;
}

/**
 * Identifiant du visiteur pour le dédoublonnage : son compte s'il est connecté, sinon une empreinte
 * de son adresse IP et de son navigateur, renouvelée chaque jour (aucun cookie, aucun suivi durable).
 */
export function identifiantVisiteur(userId: string | undefined, ip: string, agent: string, jour: string): string {
  return userId ? `u:${userId}` : `a:${createHash("sha256").update(`${ip}|${agent}|${jour}|${env.BETTER_AUTH_SECRET}`).digest("base64url").slice(0, 22)}`;
}

/** Enregistre une vue si elle est nouvelle. Renvoie true si elle a été comptée. */
export async function compterVue(chapitreId: string, visiteur: string): Promise<boolean> {
  // Limite de débit par visiteur : au-delà, ce n'est plus de la lecture.
  const cleDebit = `vues:debit:${visiteur}`;
  const debit = await redis.incr(cleDebit);
  if (debit === 1) await redis.expire(cleDebit, 3600);
  if (debit > VUES_MAX_PAR_HEURE) return false;

  // SET NX : la clé n'est posée que si elle n'existe pas déjà — une seule vue par période.
  const nouvelle = await redis.set(`vues:vu:${chapitreId}:${visiteur}`, "1", "EX", PERIODE_DEDOUBLONNAGE_S, "NX");
  if (nouvelle !== "OK") return false;

  const chapitre = await db.chapitre.findFirst({ where: { id: chapitreId, statut: "PUBLIE", serie: { statutModeration: "PUBLIEE" } }, select: { serieId: true, serie: { select: { equipeId: true } } } });
  if (!chapitre) return false;
  const date = new Date(new Date().toISOString().slice(0, 10));
  await db.$transaction([
    db.vueJournaliere.upsert({
      where: { chapitreId_date: { chapitreId, date } },
      update: { nbVues: { increment: 1 } },
      create: { chapitreId, date, serieId: chapitre.serieId, equipeId: chapitre.serie.equipeId, nbVues: 1 },
    }),
    db.chapitre.update({ where: { id: chapitreId }, data: { nbVues: { increment: 1 } } }),
    db.serie.update({ where: { id: chapitre.serieId }, data: { nbVues: { increment: 1 } } }),
  ]);
  return true;
}
