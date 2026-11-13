// Requêtes de lecture de la communauté : état d'un lecteur sur une série, critiques, profils, listes, fil.
import "server-only";
import { db } from "@/lib/db";

const CARTE = { slug: true, titre: true, type: true, classification: true, couvertureCle: true, couleurDominante: true, noteMoyenne: true, nbNotes: true } as const;
const AUTEUR = { pseudo: true, name: true, image: true } as const;
const SERIE_PUBLIEE = { statutModeration: "PUBLIEE" } as const;

/** Ce que le lecteur connecté a fait d'une série : note, suivi, statut, listes libres, critique. */
export async function etatLecteur(userId: string, serieId: string) {
  const [note, suivi, elements, listes, critique] = await Promise.all([
    db.note.findUnique({ where: { userId_serieId: { userId, serieId } }, select: { valeur: true } }),
    db.suiviSerie.findUnique({ where: { userId_serieId: { userId, serieId } }, select: { userId: true } }),
    db.elementListe.findMany({ where: { serieId, liste: { userId } }, select: { liste: { select: { id: true, type: true } } } }),
    db.liste.findMany({ where: { userId, type: "LIBRE" }, orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
    db.critique.findUnique({ where: { userId_serieId: { userId, serieId } }, select: { id: true, contenu: true, spoiler: true } }),
  ]);
  return {
    note: note?.valeur ?? null,
    suivi: Boolean(suivi),
    statut: elements.find(({ liste }) => liste.type !== "LIBRE")?.liste.type ?? null,
    listes: listes.map((liste) => ({ ...liste, present: elements.some((element) => element.liste.id === liste.id) })),
    critique,
  };
}

/** Critiques visibles d'une série, les plus appréciées d'abord. */
export async function critiquesDeLaSerie(serieId: string, userId?: string) {
  const critiques = await db.critique.findMany({
    where: { serieId, masquee: false },
    orderBy: [{ nbLikes: "desc" }, { creeLe: "desc" }],
    take: 30,
    select: { id: true, contenu: true, spoiler: true, nbLikes: true, creeLe: true, userId: true, user: { select: AUTEUR }, likes: userId ? { where: { userId }, select: { userId: true } } : false },
  });
  const notes = await db.note.findMany({ where: { serieId, userId: { in: critiques.map((c) => c.userId) } }, select: { userId: true, valeur: true } });
  return critiques.map(({ likes, userId: auteurId, ...critique }) => ({
    ...critique,
    creeLe: critique.creeLe.toISOString(),
    note: notes.find((note) => note.userId === auteurId)?.valeur ?? null,
    aime: Boolean(likes && likes.length > 0),
    aMoi: auteurId === userId,
  }));
}

/** Commentaires d'un chapitre : fils de premier niveau avec leurs réponses. */
export async function commentairesDuChapitre(chapitreId: string, userId?: string) {
  const commentaires = await db.commentaire.findMany({
    where: { chapitreId, masque: false },
    orderBy: { creeLe: "asc" },
    take: 500,
    select: { id: true, parentId: true, contenu: true, nbLikes: true, creeLe: true, userId: true, user: { select: AUTEUR }, likes: userId ? { where: { userId }, select: { userId: true } } : false },
  });
  const formater = ({ likes, userId: auteurId, ...commentaire }: (typeof commentaires)[number]) => ({
    ...commentaire,
    creeLe: commentaire.creeLe.toISOString(),
    aime: Boolean(likes && likes.length > 0),
    aMoi: auteurId === userId,
  });
  return commentaires
    .filter((commentaire) => !commentaire.parentId)
    .reverse() // fils les plus récents en premier, réponses dans l'ordre chronologique
    .map((fil) => ({ ...formater(fil), reponses: commentaires.filter((c) => c.parentId === fil.id).map(formater) }));
}

export async function profilPublic(pseudo: string, visiteurId?: string) {
  const profil = await db.user.findUnique({
    where: { pseudo },
    select: { id: true, pseudo: true, name: true, image: true, bio: true, createdAt: true, _count: { select: { abonnes: true, abonnements: true, notes: true, critiques: true, journal: true } } },
  });
  if (!profil) return null;
  const suivi = visiteurId ? Boolean(await db.suiviUtilisateur.findUnique({ where: { suiveurId_suiviId: { suiveurId: visiteurId, suiviId: profil.id } } })) : false;
  return { ...profil, suivi, aMoi: profil.id === visiteurId };
}

/** Listes d'un compte. `toutes` : inclut les listes privées (propriétaire seulement). */
export function listesDe(userId: string, toutes: boolean) {
  return db.liste.findMany({
    where: { userId, ...(toutes ? {} : { publique: true }) },
    orderBy: [{ type: "asc" }, { nom: "asc" }],
    select: {
      id: true, slug: true, nom: true, type: true, publique: true, description: true,
      _count: { select: { elements: { where: { serie: SERIE_PUBLIEE } } } },
      elements: { where: { serie: SERIE_PUBLIEE }, orderBy: { ajouteLe: "desc" }, take: 3, select: { serie: { select: { couvertureCle: true, couleurDominante: true } } } },
    },
  });
}

export async function listeParSlug(pseudo: string, slug: string, visiteurId?: string) {
  const liste = await db.liste.findFirst({
    where: { slug, user: { pseudo } },
    select: {
      id: true, nom: true, slug: true, type: true, description: true, publique: true, userId: true, user: { select: AUTEUR },
      elements: { where: { serie: SERIE_PUBLIEE }, orderBy: [{ ordre: "asc" }, { ajouteLe: "desc" }], select: { serie: { select: { id: true, ...CARTE } } } },
    },
  });
  // Une liste privée n'existe pas pour les autres.
  if (!liste || (!liste.publique && liste.userId !== visiteurId)) return null;
  return { ...liste, aMoi: liste.userId === visiteurId };
}

const ACTIVITE = {
  id: true, type: true, creeLe: true, donnees: true,
  user: { select: AUTEUR },
  serie: { select: { slug: true, titre: true, couvertureCle: true, couleurDominante: true, statutModeration: true } },
  chapitre: { select: { numero: true } },
  liste: { select: { slug: true, nom: true, publique: true } },
  cibleUser: { select: AUTEUR },
} as const;

type ActiviteBrute = Awaited<ReturnType<typeof activitesBrutes>>[number];
function activitesBrutes(where: object, limite: number) {
  return db.activite.findMany({ where, orderBy: { creeLe: "desc" }, take: limite, select: ACTIVITE });
}

/** Ne garde que ce qui peut être montré : séries publiées, listes publiques. */
function publiques(activites: ActiviteBrute[]) {
  return activites
    .filter((a) => (!a.serie || a.serie.statutModeration === "PUBLIEE") && (a.type !== "AJOUT_LISTE" || a.liste?.publique))
    .map((a) => ({ ...a, creeLe: a.creeLe.toISOString(), chapitre: a.chapitre ? { numero: a.chapitre.numero.toString() } : null }));
}

export type ActiviteAffichee = ReturnType<typeof publiques>[number];

/** Activité récente d'un compte (affichée sur son profil). */
export async function activiteDe(userId: string, limite = 20) {
  return publiques(await activitesBrutes({ userId }, limite));
}

/** Fil d'activité : ce que font les lecteurs que le compte suit. */
export async function filDActivite(userId: string, limite = 40) {
  return publiques(await activitesBrutes({ user: { abonnes: { some: { suiveurId: userId } } } }, limite));
}

/** Journal de lecture : chapitres terminés, du plus récent au plus ancien. */
export async function journalDe(userId: string, limite = 50) {
  const entrees = await db.entreeJournal.findMany({
    where: { userId, serie: SERIE_PUBLIEE },
    orderBy: { luLe: "desc" },
    take: limite,
    select: { id: true, luLe: true, chapitre: { select: { numero: true } }, serie: { select: { slug: true, titre: true, couvertureCle: true, couleurDominante: true } } },
  });
  return entrees.map((entree) => ({ ...entree, luLe: entree.luLe.toISOString(), numero: entree.chapitre.numero.toString() }));
}

export function seriesSuivies(userId: string) {
  return db.suiviSerie.findMany({ where: { userId, serie: SERIE_PUBLIEE }, orderBy: { serie: { dernierChapitreLe: "desc" } }, take: 100, select: { serie: { select: CARTE } } });
}
