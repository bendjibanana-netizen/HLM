"use server";

// Sources de synchronisation : proposition par une équipe, validation et pilotage par l'admin.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { chiffrer } from "@/lib/chiffrement";
import { db } from "@/lib/db";
import { demanderSynchronisation } from "@/lib/files";
import { compteAvecRole, membreDeLaSerie, refus, type Resultat } from "@/server/acces";

const schemaSource = z.object({
  serieId: z.string(),
  type: z.enum(["RSS", "GOOGLE_DRIVE", "DISCORD", "SITE_AUTORISE"]),
  nom: z.string().trim().min(2).max(80),
  url: z.union([z.url().max(500), z.literal("")]).optional(),
  selecteurChapitres: z.string().trim().max(200).optional(),
  selecteurImages: z.string().trim().max(200).optional(),
  salonId: z.string().trim().max(30).optional(),
  jeton: z.string().trim().max(200).optional(),
  /** D'où vient le droit de reprendre ces contenus : obligatoire, lu par l'admin avant validation. */
  autorisationNote: z.string().trim().min(10).max(2000),
  frequenceMinutes: z.number().int().min(15).max(1440).default(60),
});

/** Une équipe (ou l'admin) propose une source pour une de ses séries. Elle reste inactive jusqu'à validation par l'admin. */
export async function proposerSource(donnees: z.input<typeof schemaSource>): Promise<Resultat> {
  const valide = schemaSource.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const d = valide.data;
  const acces = await membreDeLaSerie(d.serieId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  if (d.type !== "DISCORD" && !d.url) return refus("URL_REQUISE");
  if (d.type === "SITE_AUTORISE" && (!d.selecteurChapitres || !d.selecteurImages)) return refus("SELECTEURS_REQUIS");
  if (d.type === "DISCORD" && (!d.salonId || !d.jeton)) return refus("DISCORD_INCOMPLET");
  if ((await db.sourceSync.count({ where: { serieId: d.serieId } })) >= 3) return refus("TROP_DE_SOURCES");

  const admin = acces.compte.role === "ADMIN";
  await db.sourceSync.create({
    data: {
      equipeId: acces.serie.equipeId, serieId: d.serieId, type: d.type, nom: d.nom, url: d.url || null,
      config: { selecteurChapitres: d.selecteurChapitres, selecteurImages: d.selecteurImages, salonId: d.salonId },
      secretChiffre: d.jeton ? chiffrer(d.jeton) : null,
      autorisationNote: d.autorisationNote, frequenceMinutes: d.frequenceMinutes, creeParId: acces.compte.id,
      // Une source ajoutée par l'admin est validée d'office ; celle d'une équipe attend sa décision.
      ...(admin && { valideeLe: new Date(), valideeParId: acces.compte.id }),
    },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

type ActionSource = "VALIDER" | "ACTIVER" | "PAUSE" | "SUPPRIMER" | "RELANCER";

/** Pilotage d'une source par l'admin. */
export async function piloterSource(sourceId: string, action: ActionSource): Promise<Resultat> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  const source = await db.sourceSync.findUnique({ where: { id: sourceId }, select: { valideeLe: true } });
  if (!source) return refus("INTROUVABLE");

  if (action === "SUPPRIMER") await db.sourceSync.delete({ where: { id: sourceId } });
  else if (action === "VALIDER") await db.sourceSync.update({ where: { id: sourceId }, data: { valideeLe: new Date(), valideeParId: admin.id, actif: true, erreursConsecutives: 0 } });
  else if (action === "ACTIVER") await db.sourceSync.update({ where: { id: sourceId }, data: { actif: true, erreursConsecutives: 0 } });
  else if (action === "PAUSE") await db.sourceSync.update({ where: { id: sourceId }, data: { actif: false } });
  else {
    if (!source.valideeLe) return refus("NON_VALIDEE");
    await demanderSynchronisation(sourceId, admin.id);
  }
  await db.journalModeration.create({ data: { acteurId: admin.id, action: `source.${action.toLowerCase()}`, cibleType: "SOURCE", cibleId: sourceId } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Une équipe retire une source de sa propre série. */
export async function retirerSource(sourceId: string): Promise<Resultat> {
  const source = await db.sourceSync.findUnique({ where: { id: sourceId }, select: { serieId: true } });
  if (!source?.serieId || !(await membreDeLaSerie(source.serieId))) return refus("INTERDIT");
  await db.sourceSync.delete({ where: { id: sourceId } });
  revalidatePath("/", "layout");
  return { ok: true };
}
