// Index de recherche des séries : structure des documents, réglages et synchronisation avec la base.
import "server-only";
import { db } from "@/lib/db";
import { INDEX_SERIES, meili } from "./client";

/** Document enregistré dans Meilisearch : tout ce qu'il faut pour afficher une carte sans relire la base. */
export type DocumentSerie = {
  id: string;
  slug: string;
  titre: string;
  titresAlternatifs: string[];
  synopsis: string;
  auteurs: string[];
  equipe: string;
  type: string;
  langue: string;
  statut: string;
  classification: string;
  /** Slugs des genres. */
  genres: string[];
  /** Note moyenne sur 10. */
  noteMoyenne: number;
  nbNotes: number;
  nbVues: number;
  nbChapitres: number;
  /** Dates en secondes depuis 1970 (Meilisearch trie sur des nombres). */
  dernierChapitreLe: number;
  publieeLe: number;
  couvertureCle: string | null;
  couleurDominante: string | null;
};

const secondes = (date: Date | null) => (date ? Math.floor(date.getTime() / 1000) : 0);

/** Applique les réglages de l'index. À relancer après toute modification de cette fonction. */
export async function configurerIndexSeries(): Promise<void> {
  await meili.createIndex(INDEX_SERIES, { primaryKey: "id" }).waitTask();
  await meili
    .index(INDEX_SERIES)
    .updateSettings({
      // Ordre d'importance : un mot trouvé dans le titre pèse plus que dans le synopsis.
      searchableAttributes: ["titre", "titresAlternatifs", "auteurs", "equipe", "synopsis"],
      filterableAttributes: ["type", "langue", "statut", "classification", "genres", "noteMoyenne"],
      sortableAttributes: ["nbVues", "noteMoyenne", "dernierChapitreLe", "publieeLe", "titre"],
      // Tolérance aux fautes : une faute dès 4 lettres, deux dès 8.
      typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
    })
    .waitTask();
}

/** Lit en base les séries publiées et les met sous la forme attendue par l'index. */
async function chargerDocuments(ids?: string[]): Promise<DocumentSerie[]> {
  const series = await db.serie.findMany({
    where: { statutModeration: "PUBLIEE", ...(ids && { id: { in: ids } }) },
    include: {
      equipe: { select: { nom: true } },
      auteurs: { select: { auteur: { select: { nom: true } } } },
      genres: { select: { genre: { select: { slug: true } } } },
    },
  });

  return series.map((serie) => ({
    id: serie.id,
    slug: serie.slug,
    titre: serie.titre,
    titresAlternatifs: serie.titresAlternatifs,
    synopsis: serie.synopsis,
    auteurs: serie.auteurs.map(({ auteur }) => auteur.nom),
    equipe: serie.equipe.nom,
    type: serie.type,
    langue: serie.langue,
    statut: serie.statut,
    classification: serie.classification,
    genres: serie.genres.map(({ genre }) => genre.slug),
    noteMoyenne: serie.noteMoyenne,
    nbNotes: serie.nbNotes,
    nbVues: serie.nbVues,
    nbChapitres: serie.nbChapitres,
    dernierChapitreLe: secondes(serie.dernierChapitreLe),
    publieeLe: secondes(serie.publieeLe),
    couvertureCle: serie.couvertureCle,
    couleurDominante: serie.couleurDominante,
  }));
}

/** Reconstruit l'index complet à partir de la base. */
export async function reindexerToutesLesSeries(): Promise<number> {
  await configurerIndexSeries();
  const documents = await chargerDocuments();
  const index = meili.index<DocumentSerie>(INDEX_SERIES);
  await index.deleteAllDocuments().waitTask();
  if (documents.length > 0) await index.addDocuments(documents).waitTask();
  return documents.length;
}

/**
 * Met à jour une série dans l'index (ou la retire si elle n'est plus publiée).
 * À appeler après chaque création, modification ou retrait de série.
 */
export async function indexerSerie(id: string): Promise<void> {
  const index = meili.index<DocumentSerie>(INDEX_SERIES);
  const [document] = await chargerDocuments([id]);
  if (document) await index.addDocuments([document]);
  else await index.deleteDocument(id);
}
