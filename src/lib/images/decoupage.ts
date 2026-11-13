// Découpage des longues planches de webtoon en segments plus courts.
// Une image de plusieurs dizaines de milliers de pixels de haut est lourde à décoder sur téléphone :
// on la coupe de préférence dans une « gouttière » (bande unie entre deux cases).
import "server-only";
import sharp from "sharp";

/** Au-delà de ce rapport hauteur/largeur, la planche est considérée comme une bande à découper. */
const RAPPORT_MAX = 2.5;
/** Hauteur visée d'un segment, en multiple de la largeur. */
const RAPPORT_SEGMENT = 1.8;

/**
 * Cherche, autour de la coupe idéale, la ligne la plus « unie » de l'image.
 * `lignes` contient pour chaque ligne l'écart de luminosité entre ses pixels (0 = ligne unie).
 */
export function meilleureCoupe(lignes: Float64Array | number[], ideale: number, marge: number): number {
  const debut = Math.max(1, Math.round(ideale - marge));
  const fin = Math.min(lignes.length - 1, Math.round(ideale + marge));
  let meilleure = Math.min(Math.round(ideale), lignes.length - 1);
  let scoreMin = Infinity;
  for (let y = debut; y <= fin; y++) {
    // À écart égal, on préfère la ligne la plus proche de la coupe idéale.
    const score = lignes[y]! + Math.abs(y - ideale) / (marge * 50);
    if (score < scoreMin) {
      scoreMin = score;
      meilleure = y;
    }
  }
  return meilleure;
}

/** Positions verticales des coupes d'une image de dimensions données. */
export function calculerCoupes(largeur: number, hauteur: number, lignes: Float64Array | number[]): number[] {
  if (hauteur <= largeur * RAPPORT_MAX) return [];
  const hauteurSegment = largeur * RAPPORT_SEGMENT;
  const echelle = lignes.length / hauteur; // les lignes sont mesurées sur une version réduite de l'image
  const coupes: number[] = [];
  let depart = 0;
  // On s'arrête quand le reste tient dans un dernier segment de taille raisonnable.
  while (hauteur - depart > hauteurSegment * 1.4) {
    const ideale = (depart + hauteurSegment) * echelle;
    const coupe = Math.round(meilleureCoupe(lignes, ideale, hauteurSegment * 0.25 * echelle) / echelle);
    coupes.push(coupe);
    depart = coupe;
  }
  return coupes;
}

/** Découpe une planche trop haute en segments ; renvoie l'image telle quelle si elle est de taille normale. */
export async function decouperPlanche(source: Buffer): Promise<Buffer[]> {
  const { width: largeur, height: hauteur } = await sharp(source).metadata();
  if (!largeur || !hauteur) throw new Error("Image illisible : dimensions introuvables.");
  if (hauteur <= largeur * RAPPORT_MAX) return [source];

  // Analyse sur une version réduite en niveaux de gris : rapide, et suffisante pour repérer les gouttières.
  const largeurAnalyse = 64;
  const hauteurAnalyse = Math.max(1, Math.round((hauteur / largeur) * largeurAnalyse));
  const pixels = await sharp(source).resize(largeurAnalyse, hauteurAnalyse, { fit: "fill" }).greyscale().raw().toBuffer();
  const lignes = new Float64Array(hauteurAnalyse);
  for (let y = 0; y < hauteurAnalyse; y++) {
    let min = 255;
    let max = 0;
    for (let x = 0; x < largeurAnalyse; x++) {
      const valeur = pixels[y * largeurAnalyse + x]!;
      if (valeur < min) min = valeur;
      if (valeur > max) max = valeur;
    }
    lignes[y] = max - min;
  }

  const bornes = [0, ...calculerCoupes(largeur, hauteur, lignes), hauteur];
  const segments: Buffer[] = [];
  for (let i = 0; i < bornes.length - 1; i++) {
    const haut = bornes[i]!;
    segments.push(await sharp(source).extract({ left: 0, top: haut, width: largeur, height: bornes[i + 1]! - haut }).png().toBuffer());
  }
  return segments;
}
