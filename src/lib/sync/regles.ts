// Règles pures de la synchronisation : numéro de chapitre, robots.txt, adresses interdites.
// Sans accès réseau, donc testables directement.

/** Extrait un numéro de chapitre d'un titre : « Chapitre 12.5 », « Ch. 7 », « Épisode 3 », « #4 », ou un nombre final. */
export function extraireNumero(titre: string): string | null {
  const texte = titre.normalize("NFC");
  const motif = /(?:chapitre|chapter|chap\.?|ch\.?|[ée]pisode|episode|ep\.?|#)\s*(\d{1,5}(?:[.,]\d{1,2})?)/i;
  const trouve = texte.match(motif)?.[1] ?? texte.match(/(\d{1,5}(?:[.,]\d{1,2})?)\s*$/)?.[1];
  if (!trouve) return null;
  const numero = trouve.replace(",", ".");
  // « 012 » et « 12.0 » désignent le chapitre 12.
  return String(Number(numero));
}

/**
 * Indique si un chemin est autorisé par un fichier robots.txt pour notre robot.
 * Les règles du groupe qui nous nomme l'emportent sur celles du groupe « * » ;
 * à l'intérieur d'un groupe, la règle la plus longue qui correspond décide.
 */
export function autoriseParRobots(robotsTxt: string, chemin: string, agent: string): boolean {
  const groupes: { agents: string[]; regles: { autorise: boolean; chemin: string }[] }[] = [];
  let courant: (typeof groupes)[number] | null = null;
  let dernierEstAgent = false;

  for (const ligneBrute of robotsTxt.split(/\r?\n/)) {
    const ligne = ligneBrute.split("#")[0]!.trim();
    const separateur = ligne.indexOf(":");
    if (separateur < 0) continue;
    const cle = ligne.slice(0, separateur).trim().toLowerCase();
    const valeur = ligne.slice(separateur + 1).trim();
    if (cle === "user-agent") {
      if (!courant || !dernierEstAgent) {
        courant = { agents: [], regles: [] };
        groupes.push(courant);
      }
      courant.agents.push(valeur.toLowerCase());
      dernierEstAgent = true;
    } else if ((cle === "allow" || cle === "disallow") && courant) {
      // « Disallow: » vide signifie « tout est autorisé » : la règle est ignorée.
      if (valeur) courant.regles.push({ autorise: cle === "allow", chemin: valeur });
      dernierEstAgent = false;
    } else {
      dernierEstAgent = false;
    }
  }

  const nom = agent.toLowerCase();
  const groupe = groupes.find((g) => g.agents.some((a) => a !== "*" && nom.includes(a))) ?? groupes.find((g) => g.agents.includes("*"));
  if (!groupe) return true;

  const correspond = (regle: string) => {
    const motif = regle.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$");
    return new RegExp(`^${motif}`).test(chemin);
  };
  const applicables = groupe.regles.filter((regle) => correspond(regle.chemin)).sort((a, b) => b.chemin.length - a.chemin.length || Number(b.autorise) - Number(a.autorise));
  return applicables[0]?.autorise ?? true;
}

/** Vrai pour une adresse IP interne (boucle locale, réseau privé, lien local) : jamais contactée par le robot. */
export function estAdresseInterne(ip: string): boolean {
  const v4 = ip.match(/^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}
