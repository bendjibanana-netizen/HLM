// Contrôles d'accès communs aux actions serveur et aux routes d'API.
// Chaque fonction renvoie null quand l'accès est refusé : l'appelant répond alors « interdit ».
import "server-only";
import { db } from "@/lib/db";
import { aAuMoinsLeRole, estSuspendu, type RoleGlobal } from "@/lib/permissions";
import { obtenirSession } from "@/lib/session";

export type Resultat<T = object> = ({ ok: true } & T) | { ok: false; erreur: string };
export const refus = (erreur: string): { ok: false; erreur: string } => ({ ok: false, erreur });

/** Compte connecté et non suspendu. */
export async function compteActif() {
  const session = await obtenirSession();
  if (!session || estSuspendu(session.user.suspenduJusquAu)) return null;
  return session.user;
}

export async function compteAvecRole(role: RoleGlobal) {
  const compte = await compteActif();
  return compte && aAuMoinsLeRole(compte.role as RoleGlobal, role) ? compte : null;
}

/** Équipes dont le compte est membre. */
export function equipesDe(userId: string) {
  return db.membreEquipe.findMany({
    where: { userId },
    orderBy: { rejointLe: "asc" },
    select: { role: true, equipe: { select: { id: true, slug: true, nom: true, statut: true } } },
  });
}

/**
 * Vérifie que le compte connecté est membre de l'équipe (un admin a accès à toutes).
 * `ecriture` exige en plus que l'équipe ne soit pas suspendue.
 */
export async function membreDe(equipeId: string, options: { chef?: boolean; ecriture?: boolean } = {}) {
  const compte = await compteActif();
  if (!compte) return null;
  const equipe = await db.equipe.findUnique({
    where: { id: equipeId },
    select: { id: true, nom: true, statut: true, membres: { where: { userId: compte.id }, select: { role: true } } },
  });
  if (!equipe) return null;
  const admin = compte.role === "ADMIN";
  const membre = equipe.membres[0];
  if (!membre && !admin) return null;
  if (options.chef && !admin && membre?.role !== "CHEF") return null;
  if (options.ecriture && equipe.statut !== "ACTIVE") return null;
  return { compte, equipe, chef: admin || membre?.role === "CHEF" };
}

/** Accès à une série par un membre de son équipe. */
export async function membreDeLaSerie(serieId: string, options: { ecriture?: boolean } = {}) {
  const serie = await db.serie.findUnique({ where: { id: serieId }, select: { id: true, equipeId: true, statutModeration: true, slug: true } });
  if (!serie) return null;
  const acces = await membreDe(serie.equipeId, options);
  return acces ? { ...acces, serie } : null;
}

/** Accès à un chapitre par un membre de l'équipe de sa série. */
export async function membreDuChapitre(chapitreId: string, options: { ecriture?: boolean } = {}) {
  const chapitre = await db.chapitre.findUnique({ where: { id: chapitreId }, select: { id: true, serieId: true, statut: true, nbPages: true } });
  if (!chapitre) return null;
  const acces = await membreDeLaSerie(chapitre.serieId, options);
  return acces ? { ...acces, chapitre } : null;
}

/**
 * Vrai si le compte connecté peut voir une série avant sa publication :
 * membre de son équipe, modérateur ou admin.
 */
export async function peutPrevisualiser(slug: string): Promise<boolean> {
  const compte = await compteActif();
  if (!compte) return false;
  if (aAuMoinsLeRole(compte.role as RoleGlobal, "MODERATEUR")) return true;
  const membre = await db.membreEquipe.findFirst({ where: { userId: compte.id, equipe: { series: { some: { slug } } } }, select: { id: true } });
  return Boolean(membre);
}
