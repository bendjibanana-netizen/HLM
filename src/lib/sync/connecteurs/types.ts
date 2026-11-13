// Contrat commun des connecteurs de synchronisation.

/** Un chapitre repéré sur la source, pas encore importé. */
export type ChapitreDetecte = {
  /** Identifiant stable côté source : sert à ne jamais importer deux fois le même chapitre. */
  identifiantExterne: string;
  numero: string;
  titre: string | null;
  /** Récupère les images du chapitre, dans l'ordre de lecture. Appelé seulement pour les chapitres à importer. */
  images: () => Promise<Buffer[]>;
};

export type SourceALire = { url: string | null; config: Record<string, unknown>; secret: string | null };
export type Connecteur = (source: SourceALire) => Promise<ChapitreDetecte[]>;

export const IMAGES_MAX_PAR_CHAPITRE = 200;
