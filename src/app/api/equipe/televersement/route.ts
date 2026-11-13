// Envoi de fichiers par les équipes : planches d'un chapitre, couverture ou preuve d'autorisation.
// POST multipart/form-data : champ « fichier » + « type » (page | couverture | preuve) + identifiant de la cible.
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { traiterVisuel } from "@/lib/images/traitement";
import { indexerSerie } from "@/lib/recherche/series";
import { deposerFichierPrive } from "@/lib/stockage";
import { membreDeLaSerie, membreDuChapitre } from "@/server/acces";

const TAILLE_MAX_IMAGE = 25 * 1024 * 1024;
const TAILLE_MAX_PREUVE = 10 * 1024 * 1024;
const PLANCHES_MAX = 300;
const FORMATS_IMAGE = ["jpeg", "png", "webp", "avif", "gif"];
const TYPES_PREUVE = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const erreur = (code: string, statut: number) => NextResponse.json({ erreur: code }, { status: statut });

/** Vérifie qu'un fichier est bien une image lisible (le nom et le type annoncés ne prouvent rien). */
async function lireImage(fichier: File) {
  if (fichier.size > TAILLE_MAX_IMAGE) return null;
  const contenu = Buffer.from(await fichier.arrayBuffer());
  try {
    const { format, width, height } = await sharp(contenu).metadata();
    if (!format || !FORMATS_IMAGE.includes(format) || !width || !height) return null;
    // Dimensions démesurées : refusées avant tout traitement coûteux.
    if (width > 12_000 || height > 80_000) return null;
    return { contenu, largeur: width, hauteur: height, format };
  } catch {
    return null;
  }
}

export async function POST(requete: Request) {
  const formulaire = await requete.formData().catch(() => null);
  const fichier = formulaire?.get("fichier");
  const type = formulaire?.get("type");
  if (!formulaire || !(fichier instanceof File)) return erreur("FICHIER_MANQUANT", 400);

  if (type === "page") {
    const acces = await membreDuChapitre(String(formulaire.get("chapitreId")), { ecriture: true });
    if (!acces) return erreur("INTERDIT", 403);
    if (acces.chapitre.statut !== "BROUILLON") return erreur("DEJA_ENVOYE", 409);
    const existantes = await db.page.aggregate({ where: { chapitreId: acces.chapitre.id }, _count: true, _max: { ordre: true } });
    if (existantes._count >= PLANCHES_MAX) return erreur("TROP_DE_PLANCHES", 400);
    const image = await lireImage(fichier);
    if (!image) return erreur("IMAGE_INVALIDE", 400);

    // L'original va dans un dossier privé : seules les déclinaisons produites par le worker seront publiques.
    const cle = `prive/chapitres/${acces.chapitre.id}/${randomUUID()}.${image.format}`;
    await deposerFichierPrive(cle, image.contenu, `image/${image.format}`);
    const page = await db.page.create({
      data: { chapitreId: acces.chapitre.id, ordre: (existantes._max.ordre ?? -1) + 1, cleOriginale: cle, largeur: image.largeur, hauteur: image.hauteur },
      select: { id: true },
    });
    return NextResponse.json({ id: page.id });
  }

  const acces = await membreDeLaSerie(String(formulaire.get("serieId")), { ecriture: true });
  if (!acces) return erreur("INTERDIT", 403);

  if (type === "couverture") {
    const image = await lireImage(fichier);
    if (!image || image.largeur < 300) return erreur("IMAGE_INVALIDE", 400);
    // Recadrage au rapport 2:3 des couvertures, centré sur la zone la plus intéressante de l'image.
    const recadree = await sharp(image.contenu).resize(720, 1080, { fit: "cover", position: "attention" }).png().toBuffer();
    const visuel = await traiterVisuel(recadree, `series/${acces.serie.id}`, "couverture");
    await db.serie.update({ where: { id: acces.serie.id }, data: { couvertureCle: visuel.cle, couleurDominante: visuel.couleurDominante } });
    if (acces.serie.statutModeration === "PUBLIEE") await indexerSerie(acces.serie.id).catch(() => {});
    return NextResponse.json({ cle: visuel.cle });
  }

  if (type === "preuve") {
    if (fichier.size > TAILLE_MAX_PREUVE || !TYPES_PREUVE.includes(fichier.type)) return erreur("FICHIER_INVALIDE", 400);
    const extension = fichier.type === "application/pdf" ? "pdf" : fichier.type.split("/")[1];
    const cle = `prive/preuves/${acces.serie.id}/${randomUUID()}.${extension}`;
    await deposerFichierPrive(cle, Buffer.from(await fichier.arrayBuffer()), fichier.type);
    await db.serie.update({ where: { id: acces.serie.id }, data: { preuveAutorisationCle: cle } });
    return NextResponse.json({ ok: true });
  }

  return erreur("TYPE_INCONNU", 400);
}
