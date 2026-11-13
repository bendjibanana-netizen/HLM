// Publication des chapitres : passage au statut « publié » et mise à jour de ce qui en dépend.
import "server-only";
import { db } from "@/lib/db";
import { indexerSerie } from "@/lib/recherche/series";

/** Recalcule les compteurs de chapitres d'une série à partir de ses chapitres publiés. */
export async function recalculerSerie(serieId: string): Promise<void> {
  const agregat = await db.chapitre.aggregate({
    where: { serieId, statut: "PUBLIE" },
    _count: true,
    _max: { publieLe: true },
  });
  await db.serie.update({
    where: { id: serieId },
    data: { nbChapitres: agregat._count, dernierChapitreLe: agregat._max.publieLe },
  });
  // L'index de recherche est secondaire : une panne de Meilisearch ne doit pas bloquer une publication.
  await indexerSerie(serieId).catch((erreur) => console.error("[recherche] indexation impossible :", erreur));
}

/** Passe un chapitre en « publié ». Renvoie false s'il n'était pas publiable (déjà publié, sans planche…). */
export async function publierChapitre(chapitreId: string): Promise<boolean> {
  const chapitre = await db.chapitre.findUnique({ where: { id: chapitreId }, select: { serieId: true, statut: true, nbPages: true } });
  if (!chapitre || chapitre.nbPages === 0 || !["BROUILLON", "PROGRAMME", "EN_TRAITEMENT"].includes(chapitre.statut)) return false;

  await db.chapitre.update({ where: { id: chapitreId }, data: { statut: "PUBLIE", publieLe: new Date(), programmePour: null } });
  await recalculerSerie(chapitre.serieId);
  return true;
}

/** Publie les chapitres programmés dont l'heure est arrivée. Appelé chaque minute par le worker. */
export async function publierChapitresProgrammes(): Promise<number> {
  const dus = await db.chapitre.findMany({
    where: { statut: "PROGRAMME", programmePour: { lte: new Date() } },
    select: { id: true },
  });
  let publies = 0;
  for (const { id } of dus) {
    if (await publierChapitre(id)) publies++;
  }
  return publies;
}
