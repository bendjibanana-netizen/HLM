// Accès à la session côté serveur et garde-fous d'accès aux pages.
import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { getPathname, redirect } from "@/i18n/navigation";
import type { CheminStatique } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { aAuMoinsLeRole, type RoleGlobal } from "@/lib/permissions";

/** Session du visiteur, ou null. Mise en cache pour la durée d'une requête. */
export const obtenirSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Exige un compte connecté ; sinon redirige vers la page de connexion,
 * qui renverra ensuite le lecteur vers la page `retour` (dans sa langue).
 */
export async function exigerConnexion(retour: CheminStatique) {
  const session = await obtenirSession();
  if (!session) {
    const locale = await getLocale();
    const suite = getPathname({ href: retour, locale });
    return redirect({ href: { pathname: "/connexion", query: { suite } }, locale });
  }
  return session;
}

/**
 * Exige un rôle minimal. Un compte connecté sans le rôle reçoit une page 404 :
 * on ne révèle pas l'existence des espaces d'administration.
 */
export async function exigerRole(roleExige: RoleGlobal, retour: CheminStatique) {
  const session = await exigerConnexion(retour);
  if (!aAuMoinsLeRole(session.user.role as RoleGlobal, roleExige)) {
    notFound();
  }
  return session;
}
