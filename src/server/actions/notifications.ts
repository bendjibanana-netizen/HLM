"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { compteActif, refus, type Resultat } from "@/server/acces";

export async function toutMarquerLu(): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  await db.notification.updateMany({ where: { userId: compte.id, lueLe: null }, data: { lueLe: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const schemaPreferences = z.object({ chapitreSite: z.boolean(), chapitrePush: z.boolean(), chapitreEmail: z.boolean() });

export async function reglerNotifications(donnees: z.input<typeof schemaPreferences>): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const valide = schemaPreferences.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  await db.preferenceNotification.upsert({ where: { userId: compte.id }, update: valide.data, create: { userId: compte.id, ...valide.data } });
  return { ok: true };
}

const schemaAbonnement = z.object({ endpoint: z.url().max(1000), p256dh: z.string().min(10).max(200), auth: z.string().min(5).max(100) });

/** Enregistre l'abonnement push de l'appareil courant. */
export async function abonnerPush(donnees: z.input<typeof schemaAbonnement>, agent: string): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const valide = schemaAbonnement.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  await db.abonnementPush.upsert({ where: { endpoint: valide.data.endpoint }, update: { ...valide.data, userId: compte.id }, create: { ...valide.data, userId: compte.id, userAgent: agent.slice(0, 200) } });
  return { ok: true };
}

export async function desabonnerPush(endpoint: string): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  await db.abonnementPush.deleteMany({ where: { endpoint, userId: compte.id } });
  return { ok: true };
}
