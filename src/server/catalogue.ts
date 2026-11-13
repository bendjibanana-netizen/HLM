// Requêtes de lecture du catalogue : accueil, fiche série, chapitre.
// Règle commune : seules les séries validées et les chapitres publiés sont visibles.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const SERIE_VISIBLE = { statutModeration: "PUBLIEE" } satisfies Prisma.SerieWhereInput;
const chapitreVisible = () => ({ statut: "PUBLIE", publieLe: { lte: new Date() } }) satisfies Prisma.ChapitreWhereInput;

/** Champs nécessaires à l'affichage d'une carte de série. */
const CARTE = {
  id: true,
  slug: true,
  titre: true,
  type: true,
  langue: true,
  classification: true,
  couvertureCle: true,
  couleurDominante: true,
  noteMoyenne: true,
  nbNotes: true,
  nbChapitres: true,
} satisfies Prisma.SerieSelect;

export type SerieCarte = Prisma.SerieGetPayload<{ select: typeof CARTE }>;

export function seriesTendances(limite = 12) {
  return db.serie.findMany({ where: SERIE_VISIBLE, orderBy: { nbVues: "desc" }, take: limite, select: CARTE });
}

export function seriesNouveautes(limite = 12) {
  return db.serie.findMany({ where: SERIE_VISIBLE, orderBy: { publieeLe: "desc" }, take: limite, select: CARTE });
}

/** Les mieux notées, à partir de 3 notes pour qu'une seule note ne suffise pas à dominer le classement. */
export function seriesMieuxNotees(limite = 12) {
  return db.serie.findMany({
    where: { ...SERIE_VISIBLE, nbNotes: { gte: 3 } },
    orderBy: [{ noteMoyenne: "desc" }, { nbNotes: "desc" }],
    take: limite,
    select: CARTE,
  });
}

/** Séries du carrousel de l'accueil, dans l'ordre choisi par l'admin et dans leur période d'affichage. */
export function misesEnAvant() {
  const maintenant = new Date();
  return db.miseEnAvant.findMany({
    where: {
      actif: true,
      serie: SERIE_VISIBLE,
      AND: [
        { OR: [{ debutLe: null }, { debutLe: { lte: maintenant } }] },
        { OR: [{ finLe: null }, { finLe: { gte: maintenant } }] },
      ],
    },
    orderBy: { ordre: "asc" },
    take: 6,
    select: {
      id: true,
      accroche: true,
      serie: { select: { ...CARTE, banniereCle: true, synopsis: true } },
    },
  });
}

/** Chapitres publiés ces 7 derniers jours, du plus récent au plus ancien. */
export function sortiesDeLaSemaine() {
  const maintenant = new Date();
  const ilYA7Jours = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
  return db.chapitre.findMany({
    where: { statut: "PUBLIE", publieLe: { gte: ilYA7Jours, lte: maintenant }, serie: SERIE_VISIBLE },
    orderBy: { publieLe: "desc" },
    take: 60,
    select: {
      id: true,
      numero: true,
      titre: true,
      publieLe: true,
      serie: { select: { slug: true, titre: true, type: true, couvertureCle: true, couleurDominante: true } },
    },
  });
}

/** Chapitres montrés en aperçu : tout ce qui a des planches traitées, publié ou non. */
const CHAPITRE_APERCU = { statut: { in: ["PUBLIE", "PROGRAMME", "BROUILLON"] }, nbPages: { gt: 0 } } satisfies Prisma.ChapitreWhereInput;

/**
 * Fiche complète d'une série avec ses chapitres publiés.
 * `apercu` : montre aussi une série non validée et ses chapitres non publiés (équipe, modération).
 */
export function serieParSlug(slug: string, apercu = false) {
  return db.serie.findFirst({
    where: { slug, ...(apercu ? {} : SERIE_VISIBLE) },
    include: {
      equipe: { select: { slug: true, nom: true } },
      auteurs: { select: { role: true, auteur: { select: { slug: true, nom: true } } } },
      genres: { select: { genre: { select: { slug: true, nomFr: true, nomEn: true } } } },
      chapitres: {
        where: apercu ? CHAPITRE_APERCU : chapitreVisible(),
        orderBy: { numero: "desc" },
        select: { id: true, numero: true, titre: true, publieLe: true, nbPages: true, statut: true },
      },
    },
  });
}

/** Un chapitre prêt à lire : ses planches, la série et les numéros des chapitres voisins. */
export async function chapitrePourLecture(slug: string, numero: string, apercu = false) {
  // Le numéro vient de l'URL : on n'accepte qu'un nombre de la forme 12 ou 12.5.
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(numero)) return null;

  const serie = await db.serie.findFirst({
    where: { slug, ...(apercu ? {} : SERIE_VISIBLE) },
    select: { id: true, slug: true, titre: true, sensLecture: true, classification: true, type: true },
  });
  if (!serie) return null;
  const visible = apercu ? CHAPITRE_APERCU : chapitreVisible();

  const chapitre = await db.chapitre.findFirst({
    where: { serieId: serie.id, numero, ...visible },
    select: {
      id: true,
      numero: true,
      titre: true,
      pages: { orderBy: { ordre: "asc" }, select: { id: true, largeur: true, hauteur: true, variantes: true, apercuFlou: true } },
    },
  });
  if (!chapitre) return null;

  const [precedent, suivant] = await Promise.all([
    db.chapitre.findFirst({
      where: { serieId: serie.id, numero: { lt: chapitre.numero }, ...visible },
      orderBy: { numero: "desc" },
      select: { numero: true },
    }),
    db.chapitre.findFirst({
      where: { serieId: serie.id, numero: { gt: chapitre.numero }, ...visible },
      orderBy: { numero: "asc" },
      // Les deux premières planches du chapitre suivant sont préchargées en fin de lecture.
      select: { numero: true, pages: { orderBy: { ordre: "asc" }, take: 2, select: { variantes: true } } },
    }),
  ]);

  return { serie, chapitre, precedent, suivant };
}

/** Liste des genres, pour les filtres du catalogue. */
export function tousLesGenres() {
  return db.genre.findMany({ orderBy: { nomFr: "asc" }, select: { slug: true, nomFr: true, nomEn: true } });
}

/** Lectures en cours d'un compte, de la plus récente à la plus ancienne (« Reprendre ma lecture »). */
export function lecturesEnCours(userId: string, limite = 10) {
  return db.progression.findMany({
    where: { userId, serie: SERIE_VISIBLE, chapitre: { statut: "PUBLIE" } },
    orderBy: { majLe: "desc" },
    take: limite,
    select: {
      page: true,
      ratio: true,
      termine: true,
      chapitre: { select: { numero: true, nbPages: true } },
      serie: { select: { slug: true, titre: true, couvertureCle: true, couleurDominante: true } },
    },
  });
}
