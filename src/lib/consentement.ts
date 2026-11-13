// Consentement aux cookies (RGPD). Le choix est stocké dans un cookie lisible par le navigateur
// et par le serveur ; sans choix exprimé, rien d'autre que le strict nécessaire n'est déposé.

export const COOKIE_CONSENTEMENT = "consentement";
/** Durée de validité du choix : six mois, puis la question est reposée. */
export const DUREE_CONSENTEMENT_JOURS = 182;

export type Consentement = { mesure: boolean; publicite: boolean };

/** Lit le choix enregistré ; null si le visiteur ne s'est pas encore prononcé. */
export function lireConsentement(valeur: string | undefined | null): Consentement | null {
  if (!valeur) return null;
  const [version, mesure, publicite] = decodeURIComponent(valeur).split(".");
  if (version !== "v1") return null;
  return { mesure: mesure === "1", publicite: publicite === "1" };
}

export function ecrireConsentement(choix: Consentement): string {
  return `v1.${choix.mesure ? 1 : 0}.${choix.publicite ? 1 : 0}`;
}
