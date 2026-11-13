// Traduction des erreurs renvoyées par l'authentification en clés de messages (Auth.erreurs.*).

export type CleErreurAuth =
  | "INVALID_EMAIL_OR_PASSWORD"
  | "USER_ALREADY_EXISTS"
  | "INVALID_EMAIL"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_TOO_LONG"
  | "INVALID_TOKEN"
  | "PSEUDO_DEJA_PRIS"
  | "PSEUDO_INVALIDE"
  | "TROP_DE_TENTATIVES"
  | "INCONNUE";

const CODES_CONNUS: Record<string, CleErreurAuth> = {
  INVALID_EMAIL_OR_PASSWORD: "INVALID_EMAIL_OR_PASSWORD",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "USER_ALREADY_EXISTS",
  INVALID_EMAIL: "INVALID_EMAIL",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
  PASSWORD_TOO_LONG: "PASSWORD_TOO_LONG",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "INVALID_TOKEN",
  PSEUDO_DEJA_PRIS: "PSEUDO_DEJA_PRIS",
  PSEUDO_INVALIDE: "PSEUDO_INVALIDE",
};

/** Associe une erreur du serveur d'authentification à un message compréhensible. */
export function cleErreurAuth(erreur: { code?: string; status?: number } | null | undefined): CleErreurAuth {
  if (erreur?.status === 429) return "TROP_DE_TENTATIVES";
  return (erreur?.code && CODES_CONNUS[erreur.code]) || "INCONNUE";
}

/**
 * N'accepte comme destination après connexion qu'un chemin interne au site.
 * Empêche qu'un lien piégé (?suite=https://site-malveillant) redirige le lecteur ailleurs.
 */
export function destinationSure(suite: string | null | undefined, defaut: string): string {
  if (!suite || !suite.startsWith("/") || suite.startsWith("//") || suite.includes("\\")) return defaut;
  return suite;
}
