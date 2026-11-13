// Recherche dans le catalogue : interrogation de Meilisearch.
import "server-only";
import { INDEX_SERIES, meili } from "./client";
import type { DocumentSerie } from "./series";

import { construireFiltre, PAR_PAGE, TRI_MEILI, type Criteres } from "./criteres";

export type ResultatRecherche = {
  series: DocumentSerie[];
  total: number;
  pages: number;
};

export async function chercherSeries(criteres: Criteres): Promise<ResultatRecherche> {
  const reponse = await meili.index<DocumentSerie>(INDEX_SERIES).search(criteres.requete, {
    filter: construireFiltre(criteres),
    sort: TRI_MEILI[criteres.tri],
    page: criteres.page,
    hitsPerPage: PAR_PAGE,
  });
  return { series: reponse.hits, total: reponse.totalHits ?? 0, pages: reponse.totalPages ?? 1 };
}

/** Suggestions de la recherche instantanée : quelques séries, champs réduits à l'affichage. */
export async function suggererSeries(requete: string) {
  const reponse = await meili.index<DocumentSerie>(INDEX_SERIES).search(requete.trim().slice(0, 100), {
    limit: 6,
    attributesToRetrieve: ["slug", "titre", "type", "auteurs", "couvertureCle", "couleurDominante", "classification"],
  });
  return reponse.hits.map((serie) => ({
    slug: serie.slug,
    titre: serie.titre,
    type: serie.type,
    auteurs: serie.auteurs,
    couvertureCle: serie.couvertureCle,
    couleurDominante: serie.couleurDominante,
    classification: serie.classification,
  }));
}
