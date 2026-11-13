"use server";

// Revenus : répartition mensuelle par l'admin, informations de paiement des équipes.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { chiffrer } from "@/lib/chiffrement";
import { db } from "@/lib/db";
import { debutDuMois, ibanValide, moisSuivant, repartir } from "@/lib/revenus";
import { compteAvecRole, membreDe, refus, type Resultat } from "@/server/acces";
import { ecrireReglage } from "@/server/reglages";

const schemaPeriode = z.object({ mois: z.string(), revenuEuros: z.number().min(0).max(10_000_000), pourcentage: z.number().min(0).max(100) });

/** Crée ou recalcule la répartition d'un mois (tant qu'elle n'est pas clôturée). */
export async function calculerPeriode(donnees: z.input<typeof schemaPeriode>): Promise<Resultat> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  const valide = schemaPeriode.safeParse(donnees);
  const debut = valide.success ? debutDuMois(valide.data.mois) : null;
  if (!valide.success || !debut) return refus("DONNEES_INVALIDES");
  // Un mois ne se répartit qu'une fois terminé : ses vues ne bougent plus.
  if (moisSuivant(debut).getTime() > Date.now()) return refus("MOIS_NON_TERMINE");
  const existante = await db.periodeRevenus.findUnique({ where: { mois: debut }, select: { id: true, statut: true } });
  if (existante?.statut === "CLOTUREE") return refus("DEJA_CLOTUREE");

  const revenuTotalCentimes = Math.round(valide.data.revenuEuros * 100);
  const vues = await db.vueJournaliere.groupBy({ by: ["equipeId"], where: { date: { gte: debut, lt: moisSuivant(debut) } }, _sum: { nbVues: true } });
  const parts = repartir(revenuTotalCentimes, valide.data.pourcentage, vues.map((v) => ({ equipeId: v.equipeId, nbVues: v._sum.nbVues ?? 0 })));
  const payables = new Set((await db.infosPaiement.findMany({ where: { valideLe: { not: null } }, select: { equipeId: true } })).map((i) => i.equipeId));

  const champs = { revenuTotalCentimes, pourcentageReverse: valide.data.pourcentage, totalVues: parts.reduce((s, p) => s + p.nbVues, 0) };
  await db.$transaction(async (tx) => {
    const periode = existante ? await tx.periodeRevenus.update({ where: { id: existante.id }, data: champs }) : await tx.periodeRevenus.create({ data: { mois: debut, ...champs } });
    await tx.partRevenus.deleteMany({ where: { periodeId: periode.id } });
    // Sans informations de paiement validées, la part est calculée mais bloquée.
    await tx.partRevenus.createMany({ data: parts.map((part) => ({ periodeId: periode.id, ...part, statut: payables.has(part.equipeId) ? "EN_ATTENTE" : "BLOQUE" })) });
  });
  await ecrireReglage("pourcentageReverse", valide.data.pourcentage);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Clôture une période : les montants sont figés et les versements peuvent commencer. */
export async function cloturerPeriode(periodeId: string): Promise<Resultat> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  const { count } = await db.periodeRevenus.updateMany({ where: { id: periodeId, statut: "BROUILLON" }, data: { statut: "CLOTUREE", clotureeLe: new Date(), clotureeParId: admin.id } });
  if (count === 0) return refus("INTROUVABLE");
  await db.journalModeration.create({ data: { acteurId: admin.id, action: "revenus.cloturer", cibleType: "PERIODE", cibleId: periodeId } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Marque une part comme versée (période clôturée, équipe payable). */
export async function marquerVerse(partId: string, reference: string): Promise<Resultat> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  const part = await db.partRevenus.findUnique({ where: { id: partId }, select: { statut: true, equipeId: true, periode: { select: { statut: true } } } });
  if (!part || part.periode.statut !== "CLOTUREE") return refus("NON_CLOTUREE");
  // Une part bloquée se débloque dès que les informations de paiement de l'équipe ont été validées.
  const payable = await db.infosPaiement.findFirst({ where: { equipeId: part.equipeId, valideLe: { not: null } }, select: { equipeId: true } });
  if (!payable) return refus("INFOS_MANQUANTES");
  if (part.statut === "VERSE") return refus("DEJA_VERSE");
  await db.partRevenus.update({ where: { id: partId }, data: { statut: "VERSE", verseLe: new Date(), referenceVersement: reference.trim().slice(0, 100) || null } });
  await db.journalModeration.create({ data: { acteurId: admin.id, action: "revenus.verser", cibleType: "PART", cibleId: partId } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const schemaInfos = z.object({
  equipeId: z.string(),
  statutJuridique: z.enum(["PARTICULIER", "AUTO_ENTREPRENEUR", "SOCIETE", "ASSOCIATION", "AUTRE"]),
  raisonSociale: z.string().trim().max(160),
  siret: z.string().trim().max(20),
  titulaire: z.string().trim().min(2).max(160),
  iban: z.string().trim().max(50),
  bic: z.string().trim().max(15),
  adresse: z.string().trim().max(300),
});

/** Le chef d'équipe enregistre les informations de paiement. Toute modification demande une nouvelle validation. */
export async function enregistrerInfosPaiement(donnees: z.input<typeof schemaInfos>): Promise<Resultat> {
  const valide = schemaInfos.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { equipeId, iban, ...infos } = valide.data;
  if (!(await membreDe(equipeId, { chef: true }))) return refus("INTERDIT");
  // IBAN laissé vide : on conserve celui déjà enregistré (il n'est jamais réaffiché).
  const existant = await db.infosPaiement.findUnique({ where: { equipeId }, select: { ibanChiffre: true } });
  if (iban ? !ibanValide(iban) : !existant) return refus("IBAN_INVALIDE");
  if (["AUTO_ENTREPRENEUR", "SOCIETE"].includes(infos.statutJuridique) && !/^\d{14}$/.test(infos.siret.replace(/\s/g, ""))) return refus("SIRET_REQUIS");

  const champs = { ...infos, raisonSociale: infos.raisonSociale || null, siret: infos.siret.replace(/\s/g, "") || null, bic: infos.bic || null, adresse: infos.adresse || null, ibanChiffre: iban ? chiffrer(iban.replace(/\s+/g, "").toUpperCase()) : existant!.ibanChiffre, valideLe: null, valideParId: null };
  await db.infosPaiement.upsert({ where: { equipeId }, update: champs, create: { equipeId, ...champs } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** L'admin valide les informations de paiement d'une équipe : ses parts bloquées deviennent payables. */
export async function validerInfosPaiement(equipeId: string): Promise<Resultat> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  await db.$transaction([
    db.infosPaiement.update({ where: { equipeId }, data: { valideLe: new Date(), valideParId: admin.id } }),
    db.partRevenus.updateMany({ where: { equipeId, statut: "BLOQUE" }, data: { statut: "EN_ATTENTE" } }),
    db.journalModeration.create({ data: { acteurId: admin.id, action: "paiement.valider", cibleType: "EQUIPE", cibleId: equipeId } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}
