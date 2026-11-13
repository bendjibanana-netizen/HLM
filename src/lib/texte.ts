// Petites fonctions de texte, utilisables côté serveur comme côté navigateur.

/** Transforme un texte en identifiant d'URL : minuscules, sans accents, mots séparés par des tirets. */
export function enSlug(texte: string): string {
  return texte
    // Ligatures et lettres sans décomposition Unicode : « cœur » doit donner « coeur », pas « c-ur ».
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Comparaison « naturelle » des noms de fichiers : page2 avant page10. */
export function comparerNaturel(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
