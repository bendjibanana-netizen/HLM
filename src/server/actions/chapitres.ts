"use server";

// Chapitres : création, envoi au traitement, publication et suppression.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { demanderTraitementChapitre } from "@/lib/files";
import { supprimerPrefixe } from "@/lib/stockage";
import { membreDeLaSerie, membreDuChapitre, refus, type Resultat } from "@/server/acces";
import { publierChapitre, recalculerSerie } from "@/server/publication";

const schemaCreation = z.object({
  serieId: z.string(),
  numero: z.string().regex(/^\d{1,5}(\.\d{1,2})?$/),
  titre: z.string().trim().max(120),
});

/** Crée un chapitre vide, en brouillon ; les planches sont envoyées ensuite une par une. */
export async function creerChapitre(donnees: z.input<typeof schemaCreation>): Promise<Resultat<{ id: string }>> {
  const valide = schemaCreation.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { serieId, numero, titre } = valide.data;
  const acces = await membreDeLaSerie(serieId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  if (await db.chapitre.findFirst({ where: { serieId, numero } })) return refus("NUMERO_PRIS");

  const chapitre = await db.chapitre.create({
    data: { serieId, numero, titre: titre || null, creeParId: acces.compte.id },
    select: { id: true },
  });
  return { ok: true, id: chapitre.id };
}

const schemaEnvoi = z.object({
  chapitreId: z.string(),
  /** Identifiants des planches dans l'ordre voulu par l'équipe. */
  ordre: z.array(z.string()).min(1).max(300),
  suite: z.enum(["BROUILLON", "PUBLIER", "PROGRAMMER"]),
  /** Date de publication programmée (ISO), obligatoire si suite = PROGRAMMER. */
  programmePour: z.iso.datetime().optional(),
});

/** Fixe l'ordre des planches et lance leur traitement par le worker. */
export async function envoyerChapitre(donnees: z.input<typeof schemaEnvoi>): Promise<Resultat> {
  const valide = schemaEnvoi.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { chapitreId, ordre, suite } = valide.data;
  const acces = await membreDuChapitre(chapitreId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  if (acces.chapitre.statut !== "BROUILLON") return refus("DEJA_ENVOYE");

  const pages = await db.page.findMany({ where: { chapitreId }, select: { id: true } });
  const connues = new Set(pages.map((page) => page.id));
  if (ordre.length !== connues.size || !ordre.every((id) => connues.has(id))) return refus("PLANCHES_INCOHERENTES");

  let programmePour: Date | null = null;
  if (suite === "PUBLIER") programmePour = new Date();
  if (suite === "PROGRAMMER") {
    programmePour = valide.data.programmePour ? new Date(valide.data.programmePour) : null;
    if (!programmePour || programmePour.getTime() < Date.now() + 60_000) return refus("DATE_INVALIDE");
  }

  await db.$transaction([
    // Passage par des ordres négatifs : la contrainte d'unicité (chapitre, ordre) n'est jamais violée en cours de route.
    ...ordre.map((id, index) => db.page.update({ where: { id }, data: { ordre: -1 - index } })),
    ...ordre.map((id, index) => db.page.update({ where: { id }, data: { ordre: index } })),
    db.chapitre.update({ where: { id: chapitreId }, data: { statut: "EN_TRAITEMENT", programmePour } }),
  ]);
  await demanderTraitementChapitre(chapitreId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Publie tout de suite un chapitre en brouillon ou programmé, déjà traité. */
export async function publierMaintenant(chapitreId: string): Promise<Resultat> {
  const acces = await membreDuChapitre(chapitreId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  // Un brouillon dont les planches n'ont pas encore été traitées doit d'abord passer par l'envoi.
  const nonTraitees = await db.page.count({ where: { chapitreId, variantes: { equals: [] } } });
  if (nonTraitees > 0 || !(await publierChapitre(chapitreId))) return refus("NON_PUBLIABLE");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function supprimerChapitre(chapitreId: string): Promise<Resultat> {
  const acces = await membreDuChapitre(chapitreId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  if (acces.chapitre.statut === "EN_TRAITEMENT") return refus("EN_TRAITEMENT");
  await db.chapitre.delete({ where: { id: chapitreId } });
  await recalculerSerie(acces.chapitre.serieId);
  // Fichiers d'origine et déclinaisons du chapitre.
  await Promise.all([
    supprimerPrefixe(`prive/chapitres/${chapitreId}/`),
    supprimerPrefixe(`series/${acces.chapitre.serieId}/chapitres/${chapitreId}/`),
  ]).catch((erreur) => console.error("[stockage] nettoyage incomplet :", erreur));
  revalidatePath("/", "layout");
  return { ok: true };
}
