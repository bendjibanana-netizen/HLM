// Critères de recherche du catalogue : lecture depuis l'URL et traduction en filtre Meilisearch.
// Fonctions pures (sans accès réseau), partagées par la page du catalogue et les tests.

export const TYPES = ["WEBTOON", "MANGA", "MANHWA", "MANHUA"] as const;
export const LANGUES = ["FR", "EN"] as const;
export const STATUTS = ["EN_COURS", "TERMINE", "EN_PAUSE", "ABANDONNE"] as const;
export const CLASSIFICATIONS = ["TOUT_PUBLIC", "DOUZE_PLUS", "SEIZE_PLUS"] as const;
export const TRIS = ["pertinence", "tendances", "note", "recent", "titre"] as const;

export type Tri = (typeof TRIS)[number];

export type Criteres = {
  requete: string;
  types: string[];
  langues: string[];
  statuts: string[];
  classifications: string[];
  genres: string[];
  /** Note minimale sur 10 (0 = aucune). */
  noteMin: number;
  tri: Tri;
  page: number;
};

export const PAR_PAGE = 24;

export const TRI_MEILI: Record<Tri, string[]> = {
  pertinence: [],
  tendances: ["nbVues:desc"],
  note: ["noteMoyenne:desc"],
  recent: ["dernierChapitreLe:desc"],
  titre: ["titre:asc"],
};

type ParametresUrl = Record<string, string | string[] | undefined>;

/** Valeurs d'un paramètre d'URL répétable (?type=MANGA&type=WEBTOON), limitées aux valeurs connues. */
function liste(valeur: string | string[] | undefined, autorisees?: readonly string[]): string[] {
  const valeurs = (Array.isArray(valeur) ? valeur : valeur ? [valeur] : []).slice(0, 20);
  return autorisees ? valeurs.filter((v) => autorisees.includes(v)) : valeurs.filter((v) => /^[a-z0-9-]{1,40}$/.test(v));
}

/** Lit et assainit les critères depuis l'URL : aucune valeur de l'URL n'atteint Meilisearch sans contrôle. */
export function lireCriteres(parametres: ParametresUrl): Criteres {
  const premiere = (valeur: string | string[] | undefined) => (Array.isArray(valeur) ? valeur[0] : valeur) ?? "";
  const requete = premiere(parametres.q).trim().slice(0, 100);
  const tri = premiere(parametres.tri) as Tri;
  const note = Number(premiere(parametres.note));
  const page = Number(premiere(parametres.page));

  return {
    requete,
    types: liste(parametres.type, TYPES),
    langues: liste(parametres.langue, LANGUES),
    statuts: liste(parametres.statut, STATUTS),
    classifications: liste(parametres.classification, CLASSIFICATIONS),
    genres: liste(parametres.genre),
    noteMin: Number.isFinite(note) ? Math.max(0, Math.min(10, Math.round(note))) : 0,
    // Sans mot recherché, « pertinence » n'a pas de sens : on montre les tendances.
    tri: TRIS.includes(tri) ? tri : requete ? "pertinence" : "tendances",
    page: Number.isInteger(page) && page > 0 && page <= 500 ? page : 1,
  };
}

/** Construit le filtre Meilisearch : « ou » entre les valeurs d'un même critère, « et » entre critères. */
export function construireFiltre(criteres: Criteres): (string | string[])[] {
  const groupe = (champ: string, valeurs: string[]) => valeurs.map((valeur) => `${champ} = "${valeur}"`);
  const filtres: (string | string[])[] = [];
  if (criteres.types.length) filtres.push(groupe("type", criteres.types));
  if (criteres.langues.length) filtres.push(groupe("langue", criteres.langues));
  if (criteres.statuts.length) filtres.push(groupe("statut", criteres.statuts));
  if (criteres.classifications.length) filtres.push(groupe("classification", criteres.classifications));
  // Genres : la série doit porter tous les genres cochés.
  for (const genre of criteres.genres) filtres.push(`genres = "${genre}"`);
  if (criteres.noteMin > 0) filtres.push(`noteMoyenne >= ${criteres.noteMin}`);
  return filtres;
}
