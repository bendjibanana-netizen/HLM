"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EMPLACEMENTS, type CleEmplacement } from "@/components/pub/emplacement";
import { db } from "@/lib/db";
import { compteAvecRole, refus, type Resultat } from "@/server/acces";

const schema = z.object({ cle: z.string(), actif: z.boolean(), code: z.string().max(20_000), mobile: z.boolean(), bureau: z.boolean() });

/** Réglage d'un emplacement publicitaire par l'admin. */
export async function reglerEmplacement(donnees: z.input<typeof schema>): Promise<Resultat> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  const valide = schema.safeParse(donnees);
  if (!valide.success || !(valide.data.cle in EMPLACEMENTS)) return refus("DONNEES_INVALIDES");
  const { cle, ...reglages } = valide.data;
  const { nom, description } = EMPLACEMENTS[cle as CleEmplacement];
  const data = { ...reglages, code: reglages.code.trim() || null, nom, description };
  await db.emplacementPub.upsert({ where: { cle }, update: data, create: { cle, ...data } });
  await db.journalModeration.create({ data: { acteurId: admin.id, action: "publicite.regler", cibleType: "EMPLACEMENT", cibleId: cle, details: { actif: reglages.actif } } });
  revalidatePath("/", "layout");
  return { ok: true };
}
