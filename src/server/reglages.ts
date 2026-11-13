// Réglages globaux de la plateforme, modifiables par l'admin et stockés en base (table Reglage).
import "server-only";
import { db } from "@/lib/db";

export const REGLAGES_PAR_DEFAUT = {
  /** Nombre de retraits justifiés à partir duquel une équipe est suspendue. */
  seuilRetraits: 3,
  /** Part du revenu publicitaire reversée aux équipes, en pourcentage. */
  pourcentageReverse: 50,
};

export type CleReglage = keyof typeof REGLAGES_PAR_DEFAUT;

export async function lireReglage<C extends CleReglage>(cle: C): Promise<(typeof REGLAGES_PAR_DEFAUT)[C]> {
  const reglage = await db.reglage.findUnique({ where: { cle } });
  return typeof reglage?.valeur === "number" ? (reglage.valeur as (typeof REGLAGES_PAR_DEFAUT)[C]) : REGLAGES_PAR_DEFAUT[cle];
}

export async function ecrireReglage(cle: CleReglage, valeur: number): Promise<void> {
  await db.reglage.upsert({ where: { cle }, update: { valeur }, create: { cle, valeur } });
}
