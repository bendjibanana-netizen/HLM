// Répartition du revenu publicitaire entre les équipes, en proportion de leurs vues.
// Fonctions pures : tous les montants sont en centimes entiers, sans arrondi flottant.

export type PartCalculee = { equipeId: string; nbVues: number; montantCentimes: number };

/**
 * Répartit `revenuTotalCentimes × pourcentage` entre les équipes selon leurs vues.
 * Méthode du plus fort reste : chaque part est arrondie à l'inférieur, puis les centimes restants
 * vont aux plus grands restes. La somme des parts est donc exactement la somme à répartir.
 */
export function repartir(revenuTotalCentimes: number, pourcentageReverse: number, vuesParEquipe: { equipeId: string; nbVues: number }[]): PartCalculee[] {
  const equipes = vuesParEquipe.filter((equipe) => equipe.nbVues > 0);
  const totalVues = equipes.reduce((somme, equipe) => somme + equipe.nbVues, 0);
  // Calcul en centièmes de pourcent pour accepter 12,5 % sans flottant.
  const aRepartir = Math.floor((revenuTotalCentimes * Math.round(pourcentageReverse * 100)) / 10_000);
  if (totalVues === 0 || aRepartir <= 0) return equipes.map((equipe) => ({ ...equipe, montantCentimes: 0 }));

  const parts = equipes.map((equipe) => {
    const exact = (aRepartir * equipe.nbVues) / totalVues;
    return { ...equipe, montantCentimes: Math.floor(exact), reste: exact - Math.floor(exact) };
  });
  let restant = aRepartir - parts.reduce((somme, part) => somme + part.montantCentimes, 0);
  // À reste égal, l'ordre des identifiants départage : le résultat ne dépend pas de l'ordre d'entrée.
  for (const part of [...parts].sort((a, b) => b.reste - a.reste || a.equipeId.localeCompare(b.equipeId))) {
    if (restant-- <= 0) break;
    part.montantCentimes += 1;
  }
  return parts.map(({ equipeId, nbVues, montantCentimes }) => ({ equipeId, nbVues, montantCentimes }));
}

/** Premier jour (UTC) du mois d'une chaîne « AAAA-MM », ou null si elle est invalide. */
export function debutDuMois(mois: string): Date | null {
  const trouve = mois.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return trouve ? new Date(Date.UTC(Number(trouve[1]), Number(trouve[2]) - 1, 1)) : null;
}

export function moisSuivant(debut: Date): Date {
  return new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + 1, 1));
}

/** Contrôle d'un IBAN : forme, puis clé de contrôle (modulo 97). */
export function ibanValide(saisie: string): boolean {
  const iban = saisie.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const chiffres = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (lettre) => String(lettre.charCodeAt(0) - 55));
  let reste = 0;
  for (const chiffre of chiffres) reste = (reste * 10 + Number(chiffre)) % 97;
  return reste === 1;
}

/** Échappe une valeur pour un fichier CSV (séparateur point-virgule, lisible par Excel en français). */
export function celluleCsv(valeur: string | number): string {
  const texte = String(valeur);
  // Une cellule commençant par = + - @ serait interprétée comme une formule par un tableur : on la neutralise.
  const sure = /^[=+\-@]/.test(texte) ? `'${texte}` : texte;
  return /[";\n]/.test(sure) ? `"${sure.replace(/"/g, '""')}"` : sure;
}
