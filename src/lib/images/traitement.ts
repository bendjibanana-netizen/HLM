// Traitement des images avec sharp : déclinaisons AVIF/WebP, aperçu flou et couleur dominante.
import "server-only";
import { createHash } from "node:crypto";
import sharp, { type Sharp } from "sharp";
import { deposerFichier } from "@/lib/stockage";
import { cleVariante, FORMATS, LARGEURS, type FormatImage, type Variante } from "./variantes";

const TYPES_MIME: Record<FormatImage, string> = { avif: "image/avif", webp: "image/webp" };

async function encoder(image: Sharp, format: FormatImage): Promise<Buffer> {
  // Réglages orientés lecture : les traits et le texte des planches restent nets.
  if (format === "avif") return image.avif({ quality: 55, effort: 3 }).toBuffer();
  return image.webp({ quality: 80, effort: 4 }).toBuffer();
}

/** Empreinte courte du contenu, intégrée à la clé : deux fichiers différents n'ont jamais la même adresse. */
function empreinte(contenu: Buffer): string {
  return createHash("sha256").update(contenu).digest("hex").slice(0, 12);
}

async function genererVariantes(source: Buffer, cleBase: string, largeurs: readonly number[]): Promise<Variante[]> {
  const variantes: Variante[] = [];
  for (const largeur of largeurs) {
    for (const format of FORMATS) {
      // withoutEnlargement : une image plus petite que la largeur visée n'est jamais agrandie.
      const redimensionnee = sharp(source).resize({ width: largeur, withoutEnlargement: true });
      const cle = cleVariante(cleBase, largeur, format);
      await deposerFichier(cle, await encoder(redimensionnee, format), TYPES_MIME[format]);
      variantes.push({ format, largeur, cle });
    }
  }
  return variantes;
}

/** Aperçu minuscule et flou (moins de 1 Ko), intégré à la page pour s'afficher avant l'image. */
async function apercuFlou(source: Buffer): Promise<string> {
  const miniature = await sharp(source).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${miniature.toString("base64")}`;
}

/** Couleur dominante (#rrggbb), utilisée comme fond pendant le chargement d'une couverture. */
async function couleurDominante(source: Buffer): Promise<string> {
  const { dominant } = await sharp(source).stats();
  return `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export type PageTraitee = {
  cleOriginale: string;
  largeur: number;
  hauteur: number;
  variantes: Variante[];
  apercuFlou: string;
};

/** Traite une planche de chapitre et dépose ses déclinaisons sous `dossier`. */
export async function traiterPage(source: Buffer, dossier: string): Promise<PageTraitee> {
  const { width, height } = await sharp(source).metadata();
  if (!width || !height) throw new Error("Image illisible : dimensions introuvables.");

  const cleBase = `${dossier}/${empreinte(source)}`;
  return {
    cleOriginale: cleBase,
    largeur: width,
    hauteur: height,
    variantes: await genererVariantes(source, cleBase, LARGEURS.page),
    apercuFlou: await apercuFlou(source),
  };
}

/** Traite une couverture ou une bannière. Renvoie la clé de base à enregistrer sur la série. */
export async function traiterVisuel(
  source: Buffer,
  dossier: string,
  usage: "couverture" | "banniere",
): Promise<{ cle: string; couleurDominante: string }> {
  const cle = `${dossier}/${usage}-${empreinte(source)}`;
  await genererVariantes(source, cle, LARGEURS[usage]);
  return { cle, couleurDominante: await couleurDominante(source) };
}
