"use server";

// Actions de la communauté : notes, critiques, suivi, listes, commentaires, signalements.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { indexerSerie } from "@/lib/recherche/series";
import { enSlug } from "@/lib/texte";
import { compteActif, refus, type Resultat } from "@/server/acces";

const SERIE_PUBLIEE = { statutModeration: "PUBLIEE" } as const;
export type TypeStatut = "A_LIRE" | "EN_COURS" | "TERMINE" | "ABANDONNE";
const NOMS_STATUT: Record<TypeStatut, string> = { A_LIRE: "À lire", EN_COURS: "En cours", TERMINE: "Terminé", ABANDONNE: "Abandonné" };

/** Compte autorisé à publier du texte : connecté, non suspendu, adresse email confirmée. */
async function comptePublieur() {
  const compte = await compteActif();
  if (!compte) return { erreur: "NON_CONNECTE" as const };
  if (!compte.emailVerified) return { erreur: "EMAIL_NON_VERIFIE" as const };
  return { compte };
}

async function seriePubliee(serieId: string) {
  return db.serie.findFirst({ where: { id: serieId, ...SERIE_PUBLIEE }, select: { id: true, slug: true } });
}

/** Ajoute un événement au fil d'activité, en évitant de répéter le même dans l'heure. */
async function noterActivite(donnees: Prisma.ActiviteUncheckedCreateInput) {
  const recente = await db.activite.findFirst({
    where: { userId: donnees.userId, type: donnees.type, serieId: donnees.serieId ?? null, chapitreId: donnees.chapitreId ?? null, listeId: donnees.listeId ?? null, cibleUserId: donnees.cibleUserId ?? null, creeLe: { gte: new Date(Date.now() - 3600_000) } },
    select: { id: true },
  });
  if (recente) await db.activite.update({ where: { id: recente.id }, data: { donnees: donnees.donnees ?? undefined, creeLe: new Date() } });
  else await db.activite.create({ data: donnees });
}

// ── Notes ───────────────────────────────────────────────────────

/** Note une série de 1 à 10 (demi-étoiles) ; `null` retire la note. */
export async function noterSerie(serieId: string, valeur: number | null): Promise<Resultat<{ moyenne: number; nombre: number }>> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  if (valeur !== null && (!Number.isInteger(valeur) || valeur < 1 || valeur > 10)) return refus("DONNEES_INVALIDES");
  if (!(await seriePubliee(serieId))) return refus("INTROUVABLE");

  const cle = { userId_serieId: { userId: compte.id, serieId } };
  if (valeur === null) await db.note.deleteMany({ where: { userId: compte.id, serieId } });
  else await db.note.upsert({ where: cle, update: { valeur }, create: { userId: compte.id, serieId, valeur } });

  const agregat = await db.note.aggregate({ where: { serieId }, _avg: { valeur: true }, _count: true });
  const moyenne = Math.round((agregat._avg.valeur ?? 0) * 10) / 10;
  await db.serie.update({ where: { id: serieId }, data: { noteMoyenne: moyenne, nbNotes: agregat._count } });
  if (valeur !== null) await noterActivite({ userId: compte.id, type: "NOTE", serieId, donnees: { valeur } });
  await indexerSerie(serieId).catch(() => {});
  revalidatePath("/", "layout");
  return { ok: true, moyenne, nombre: agregat._count };
}

// ── Critiques ───────────────────────────────────────────────────

const schemaCritique = z.object({ serieId: z.string(), contenu: z.string().trim().min(20).max(5000), spoiler: z.boolean() });

export async function enregistrerCritique(donnees: z.input<typeof schemaCritique>): Promise<Resultat> {
  const { compte, erreur } = await comptePublieur();
  if (!compte) return refus(erreur);
  const valide = schemaCritique.safeParse(donnees);
  if (!valide.success) return refus("TEXTE_INVALIDE");
  const { serieId, contenu, spoiler } = valide.data;
  if (!(await seriePubliee(serieId))) return refus("INTROUVABLE");

  const critique = await db.critique.upsert({
    where: { userId_serieId: { userId: compte.id, serieId } },
    update: { contenu, spoiler },
    create: { userId: compte.id, serieId, contenu, spoiler },
    select: { id: true },
  });
  await noterActivite({ userId: compte.id, type: "CRITIQUE", serieId, critiqueId: critique.id });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function supprimerCritique(critiqueId: string): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const { count } = await db.critique.deleteMany({ where: { id: critiqueId, userId: compte.id } });
  if (count === 0) return refus("INTROUVABLE");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function aimerCritique(critiqueId: string): Promise<Resultat<{ aime: boolean; nombre: number }>> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const critique = await db.critique.findFirst({ where: { id: critiqueId, masquee: false }, select: { id: true } });
  if (!critique) return refus("INTROUVABLE");
  const cle = { userId_critiqueId: { userId: compte.id, critiqueId } };
  const existant = await db.likeCritique.findUnique({ where: cle });
  if (existant) await db.likeCritique.delete({ where: cle });
  else await db.likeCritique.create({ data: { userId: compte.id, critiqueId } });
  const nombre = await db.likeCritique.count({ where: { critiqueId } });
  await db.critique.update({ where: { id: critiqueId }, data: { nbLikes: nombre } });
  return { ok: true, aime: !existant, nombre };
}

// ── Suivi d'une série ───────────────────────────────────────────

export async function suivreSerie(serieId: string): Promise<Resultat<{ suivi: boolean }>> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  if (!(await seriePubliee(serieId))) return refus("INTROUVABLE");
  const cle = { userId_serieId: { userId: compte.id, serieId } };
  const existant = await db.suiviSerie.findUnique({ where: cle });
  if (existant) await db.suiviSerie.delete({ where: cle });
  else {
    await db.suiviSerie.create({ data: { userId: compte.id, serieId } });
    await noterActivite({ userId: compte.id, type: "SUIVI_SERIE", serieId });
  }
  await db.serie.update({ where: { id: serieId }, data: { nbAbonnes: await db.suiviSerie.count({ where: { serieId } }) } });
  revalidatePath("/", "layout");
  return { ok: true, suivi: !existant };
}

// ── Listes ──────────────────────────────────────────────────────

/** Range une série dans une liste de statut (une seule à la fois) ; `null` la retire de toutes. */
export async function definirStatut(serieId: string, statut: TypeStatut | null): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  if (statut !== null && !(statut in NOMS_STATUT)) return refus("DONNEES_INVALIDES");
  if (!(await seriePubliee(serieId))) return refus("INTROUVABLE");

  await db.elementListe.deleteMany({ where: { serieId, liste: { userId: compte.id, type: { not: "LIBRE" } } } });
  if (statut) {
    // Les listes de statut sont créées à la première utilisation.
    const liste =
      (await db.liste.findFirst({ where: { userId: compte.id, type: statut }, select: { id: true } })) ??
      (await db.liste.create({ data: { userId: compte.id, type: statut, nom: NOMS_STATUT[statut], slug: enSlug(NOMS_STATUT[statut]) }, select: { id: true } }));
    await db.elementListe.create({ data: { listeId: liste.id, serieId } });
    await noterActivite({ userId: compte.id, type: "AJOUT_LISTE", serieId, listeId: liste.id });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

const schemaListe = z.object({ nom: z.string().trim().min(1).max(60), description: z.string().trim().max(500).optional(), publique: z.boolean() });

export async function creerListe(donnees: z.input<typeof schemaListe>): Promise<Resultat<{ id: string; slug: string }>> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const valide = schemaListe.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  if ((await db.liste.count({ where: { userId: compte.id } })) >= 100) return refus("TROP_DE_LISTES");

  const base = enSlug(valide.data.nom) || "liste";
  let slug = base;
  for (let suffixe = 2; await db.liste.findUnique({ where: { userId_slug: { userId: compte.id, slug } } }); suffixe++) slug = `${base}-${suffixe}`;
  const liste = await db.liste.create({ data: { userId: compte.id, type: "LIBRE", slug, ...valide.data }, select: { id: true, slug: true } });
  revalidatePath("/", "layout");
  return { ok: true, ...liste };
}

export async function modifierListe(listeId: string, donnees: z.input<typeof schemaListe>): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const valide = schemaListe.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const liste = await db.liste.findFirst({ where: { id: listeId, userId: compte.id }, select: { type: true } });
  if (!liste) return refus("INTROUVABLE");
  // Le nom d'une liste de statut est fixe ; seule sa visibilité se règle.
  await db.liste.update({ where: { id: listeId }, data: liste.type === "LIBRE" ? valide.data : { publique: valide.data.publique } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function supprimerListe(listeId: string): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const { count } = await db.liste.deleteMany({ where: { id: listeId, userId: compte.id, type: "LIBRE" } });
  if (count === 0) return refus("INTROUVABLE");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Ajoute une série à une liste libre, ou l'en retire si elle y est déjà. */
export async function basculerDansListe(listeId: string, serieId: string): Promise<Resultat<{ present: boolean }>> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const liste = await db.liste.findFirst({ where: { id: listeId, userId: compte.id, type: "LIBRE" }, select: { id: true } });
  if (!liste || !(await seriePubliee(serieId))) return refus("INTROUVABLE");
  const cle = { listeId_serieId: { listeId, serieId } };
  const existant = await db.elementListe.findUnique({ where: cle });
  if (existant) await db.elementListe.delete({ where: cle });
  else {
    await db.elementListe.create({ data: { listeId, serieId, ordre: await db.elementListe.count({ where: { listeId } }) } });
    await noterActivite({ userId: compte.id, type: "AJOUT_LISTE", serieId, listeId });
  }
  revalidatePath("/", "layout");
  return { ok: true, present: !existant };
}

// ── Abonnement à un lecteur ─────────────────────────────────────

export async function suivreUtilisateur(pseudo: string): Promise<Resultat<{ suivi: boolean }>> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const cible = await db.user.findUnique({ where: { pseudo }, select: { id: true } });
  if (!cible || cible.id === compte.id) return refus("INTROUVABLE");
  const cle = { suiveurId_suiviId: { suiveurId: compte.id, suiviId: cible.id } };
  const existant = await db.suiviUtilisateur.findUnique({ where: cle });
  if (existant) await db.suiviUtilisateur.delete({ where: cle });
  else {
    await db.suiviUtilisateur.create({ data: { suiveurId: compte.id, suiviId: cible.id } });
    await noterActivite({ userId: compte.id, type: "SUIVI_UTILISATEUR", cibleUserId: cible.id });
  }
  revalidatePath("/", "layout");
  return { ok: true, suivi: !existant };
}

const schemaProfil = z.object({ nom: z.string().trim().min(2).max(40), bio: z.string().trim().max(300) });

export async function modifierProfil(donnees: z.input<typeof schemaProfil>): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const valide = schemaProfil.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  await db.user.update({ where: { id: compte.id }, data: { name: valide.data.nom, bio: valide.data.bio || null } });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Commentaires de chapitre ────────────────────────────────────

const schemaCommentaire = z.object({ chapitreId: z.string(), contenu: z.string().trim().min(1).max(2000), parentId: z.string().optional() });

export async function commenter(donnees: z.input<typeof schemaCommentaire>): Promise<Resultat> {
  const { compte, erreur } = await comptePublieur();
  if (!compte) return refus(erreur);
  const valide = schemaCommentaire.safeParse(donnees);
  if (!valide.success) return refus("TEXTE_INVALIDE");
  const { chapitreId, contenu, parentId } = valide.data;

  const chapitre = await db.chapitre.findFirst({ where: { id: chapitreId, statut: "PUBLIE", serie: SERIE_PUBLIEE }, select: { id: true } });
  if (!chapitre) return refus("INTROUVABLE");
  // Anti-spam : cinq commentaires par minute au plus.
  if ((await db.commentaire.count({ where: { userId: compte.id, creeLe: { gte: new Date(Date.now() - 60_000) } } })) >= 5) return refus("TROP_RAPIDE");

  let parent: string | undefined;
  if (parentId) {
    const cible = await db.commentaire.findFirst({ where: { id: parentId, chapitreId, masque: false }, select: { id: true, parentId: true } });
    if (!cible) return refus("INTROUVABLE");
    // Un seul niveau de réponses : répondre à une réponse la rattache au même fil.
    parent = cible.parentId ?? cible.id;
  }
  await db.commentaire.create({ data: { userId: compte.id, chapitreId, contenu, parentId: parent } });
  await db.chapitre.update({ where: { id: chapitreId }, data: { nbCommentaires: await db.commentaire.count({ where: { chapitreId, masque: false } }) } });
  return { ok: true };
}

export async function supprimerCommentaire(commentaireId: string): Promise<Resultat> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const commentaire = await db.commentaire.findFirst({ where: { id: commentaireId, userId: compte.id }, select: { chapitreId: true } });
  if (!commentaire) return refus("INTROUVABLE");
  await db.commentaire.delete({ where: { id: commentaireId } });
  await db.chapitre.update({ where: { id: commentaire.chapitreId }, data: { nbCommentaires: await db.commentaire.count({ where: { chapitreId: commentaire.chapitreId, masque: false } }) } });
  return { ok: true };
}

export async function aimerCommentaire(commentaireId: string): Promise<Resultat<{ aime: boolean; nombre: number }>> {
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  if (!(await db.commentaire.findFirst({ where: { id: commentaireId, masque: false }, select: { id: true } }))) return refus("INTROUVABLE");
  const cle = { userId_commentaireId: { userId: compte.id, commentaireId } };
  const existant = await db.likeCommentaire.findUnique({ where: cle });
  if (existant) await db.likeCommentaire.delete({ where: cle });
  else await db.likeCommentaire.create({ data: { userId: compte.id, commentaireId } });
  const nombre = await db.likeCommentaire.count({ where: { commentaireId } });
  await db.commentaire.update({ where: { id: commentaireId }, data: { nbLikes: nombre } });
  return { ok: true, aime: !existant, nombre };
}

// ── Signalements ────────────────────────────────────────────────

const schemaSignalement = z.object({
  cible: z.enum(["SERIE", "CHAPITRE", "COMMENTAIRE", "CRITIQUE", "UTILISATEUR"]),
  id: z.string().min(1).max(60),
  motif: z.enum(["CONTENU_ILLEGAL", "CONTENU_SEXUEL", "MAUVAISE_CLASSIFICATION", "DROITS_AUTEUR", "SPAM", "HARCELEMENT", "AUTRE"]),
  details: z.string().trim().max(1000).optional(),
});

/** Signale un contenu à la modération. Ouvert aux visiteurs comme aux comptes connectés. */
export async function signaler(donnees: z.input<typeof schemaSignalement>): Promise<Resultat> {
  const valide = schemaSignalement.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { cible, id, motif, details } = valide.data;
  const compte = await compteActif();

  const existe = {
    SERIE: () => db.serie.count({ where: { id } }),
    CHAPITRE: () => db.chapitre.count({ where: { id } }),
    COMMENTAIRE: () => db.commentaire.count({ where: { id } }),
    CRITIQUE: () => db.critique.count({ where: { id } }),
    UTILISATEUR: () => db.user.count({ where: { id } }),
  }[cible];
  if ((await existe()) === 0) return refus("INTROUVABLE");

  const colonne = { SERIE: "serieId", CHAPITRE: "chapitreId", COMMENTAIRE: "commentaireId", CRITIQUE: "critiqueId", UTILISATEUR: "utilisateurCibleId" }[cible];
  // Un même compte ne signale pas deux fois le même contenu tant que le premier signalement est ouvert.
  if (compte && (await db.signalement.count({ where: { auteurId: compte.id, [colonne]: id, statut: { in: ["OUVERT", "EN_COURS"] } } })) > 0) return { ok: true };
  await db.signalement.create({ data: { auteurId: compte?.id, cible, [colonne]: id, motif, details: details || null } });
  return { ok: true };
}
