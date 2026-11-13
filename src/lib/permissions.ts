// Règles d'accès par rôle. Fonctions pures : aucun accès à la base ni à la session.

export type RoleGlobal = "LECTEUR" | "MODERATEUR" | "ADMIN";

/** Chaque rôle inclut les droits des rôles inférieurs. */
const NIVEAU: Record<RoleGlobal, number> = {
  LECTEUR: 0,
  MODERATEUR: 1,
  ADMIN: 2,
};

/** Vrai si le rôle du compte est au moins égal au rôle exigé. */
export function aAuMoinsLeRole(role: RoleGlobal, roleExige: RoleGlobal): boolean {
  return NIVEAU[role] >= NIVEAU[roleExige];
}

/** Vrai si le compte est actuellement suspendu (ne peut plus publier ni commenter). */
export function estSuspendu(suspenduJusquAu: Date | null | undefined, maintenant = new Date()): boolean {
  return Boolean(suspenduJusquAu && suspenduJusquAu.getTime() > maintenant.getTime());
}
