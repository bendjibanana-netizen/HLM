// Conventions de nommage des images, partagées entre le serveur (génération) et le navigateur (affichage).
// Chaque image est déclinée en plusieurs largeurs et en deux formats : AVIF (le plus léger)
// et WebP (compris par tous les navigateurs récents).

export type FormatImage = "avif" | "webp";

/** Une déclinaison d'image enregistrée dans le stockage. */
export type Variante = { format: FormatImage; largeur: number; cle: string };

export const FORMATS: FormatImage[] = ["avif", "webp"];

/** Largeurs générées pour chaque usage, en pixels. */
export const LARGEURS = {
  /** Planches du lecteur : téléphone, tablette, grand écran. */
  page: [480, 800, 1200],
  /** Couvertures (rapport 2:3) : vignette, carte, fiche série. */
  couverture: [240, 480, 720],
  /** Bannières du carrousel de l'accueil. */
  banniere: [640, 1280],
} as const;

/** Adresse de base des images (CDN en production). */
const URL_IMAGES = (process.env.NEXT_PUBLIC_URL_IMAGES || "http://localhost:9000/hlm").replace(/\/$/, "");

export function urlImage(cle: string): string {
  return `${URL_IMAGES}/${cle}`;
}

/** Clé d'une déclinaison à partir de la clé de base : « base-480.webp ». */
export function cleVariante(cleBase: string, largeur: number, format: FormatImage): string {
  return `${cleBase}-${largeur}.${format}`;
}

/** Déclinaisons d'une couverture ou d'une bannière : leurs largeurs sont fixes, donc déductibles de la clé. */
export function variantesFixes(cleBase: string, usage: "couverture" | "banniere"): Variante[] {
  return FORMATS.flatMap((format) =>
    LARGEURS[usage].map((largeur) => ({ format, largeur, cle: cleVariante(cleBase, largeur, format) })),
  );
}

/** Attribut `srcset` d'un format : le navigateur choisit la largeur adaptée à l'écran. */
export function srcset(variantes: Variante[], format: FormatImage): string {
  return variantes
    .filter((variante) => variante.format === format)
    .sort((a, b) => a.largeur - b.largeur)
    .map((variante) => `${urlImage(variante.cle)} ${variante.largeur}w`)
    .join(", ");
}

/** Déclinaison la plus proche d'une largeur donnée, pour l'attribut `src` de secours. */
export function varianteProche(variantes: Variante[], format: FormatImage, largeur: number): Variante | undefined {
  return variantes
    .filter((variante) => variante.format === format)
    .sort((a, b) => Math.abs(a.largeur - largeur) - Math.abs(b.largeur - largeur))[0];
}
