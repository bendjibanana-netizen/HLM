// Règles du pseudo : identifiant public unique, utilisé dans l'URL du profil (/u/pseudo).
// Fonctions pures, partagées entre le formulaire d'inscription et le serveur.

export const PSEUDO_LONGUEUR_MIN = 3;
export const PSEUDO_LONGUEUR_MAX = 20;

const MOTIF_PSEUDO = /^[a-z0-9_]+$/;

/** Pseudos interdits : ils entreraient en conflit avec des routes ou prêteraient à confusion. */
const PSEUDOS_RESERVES = new Set([
  "admin",
  "administrateur",
  "moderateur",
  "moderation",
  "equipe",
  "support",
  "aide",
  "api",
  "compte",
  "connexion",
  "inscription",
  "systeme",
  "anonyme",
]);

export type ErreurPseudo = "TROP_COURT" | "TROP_LONG" | "CARACTERES_INVALIDES" | "RESERVE";

/** Met le pseudo saisi sous sa forme enregistrée : sans espaces autour, en minuscules. */
export function normaliserPseudo(saisie: string): string {
  return saisie.trim().toLowerCase();
}

/** Renvoie la première règle enfreinte, ou null si le pseudo (déjà normalisé) est valide. */
export function validerPseudo(pseudo: string): ErreurPseudo | null {
  if (pseudo.length < PSEUDO_LONGUEUR_MIN) return "TROP_COURT";
  if (pseudo.length > PSEUDO_LONGUEUR_MAX) return "TROP_LONG";
  if (!MOTIF_PSEUDO.test(pseudo)) return "CARACTERES_INVALIDES";
  if (PSEUDOS_RESERVES.has(pseudo)) return "RESERVE";
  return null;
}

/**
 * Fabrique une base de pseudo valide à partir d'un nom ou d'une adresse email
 * (comptes créés via Google ou Discord, où le lecteur ne choisit pas de pseudo).
 */
export function pseudoDepuis(source: string): string {
  const base = (source.split("@")[0] ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, PSEUDO_LONGUEUR_MAX - 5); // garde la place pour un suffixe numérique

  if (base.length < PSEUDO_LONGUEUR_MIN || PSEUDOS_RESERVES.has(base)) return "lecteur";
  return base;
}

/**
 * Cherche un pseudo libre à partir d'une base : la base seule, puis avec un suffixe aléatoire.
 * `estPris` interroge la base de données.
 */
export async function trouverPseudoLibre(
  base: string,
  estPris: (pseudo: string) => Promise<boolean>,
): Promise<string> {
  if (!(await estPris(base))) return base;
  for (let essai = 0; essai < 20; essai++) {
    const candidat = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await estPris(candidat))) return candidat;
  }
  // Extrêmement improbable : on se rabat sur un suffixe horodaté, toujours unique.
  return `${base.slice(0, 8)}_${Date.now().toString(36)}`.slice(0, PSEUDO_LONGUEUR_MAX);
}
