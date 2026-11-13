// Images de démonstration dessinées par code (SVG converti en image par sharp).
// Compositions abstraites et originales : formes, trames et cases, sans aucun personnage existant.
import sharp from "sharp";

/** Générateur pseudo-aléatoire reproductible : la même graine redonne les mêmes images. */
export function aleatoire(graine: string): () => number {
  let etat = 0;
  for (const caractere of graine) etat = (Math.imul(etat, 31) + caractere.charCodeAt(0)) | 0;
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const echapper = (texte: string) => texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const entre = (alea: () => number, min: number, max: number) => min + alea() * (max - min);
const POLICE = "DejaVu Sans, FreeSans, sans-serif";

async function versPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Coupe un titre en lignes d'au plus `max` caractères. */
function lignes(titre: string, max: number): string[] {
  const resultat: string[] = [];
  let courante = "";
  for (const mot of titre.split(" ")) {
    if (courante && (courante + " " + mot).length > max) {
      resultat.push(courante);
      courante = mot;
    } else {
      courante = courante ? `${courante} ${mot}` : mot;
    }
  }
  if (courante) resultat.push(courante);
  return resultat;
}

/** Trame de points, signature visuelle des planches. */
function trame(id: string, couleur: string, pas: number, rayon: number): string {
  return `<pattern id="${id}" width="${pas}" height="${pas}" patternUnits="userSpaceOnUse"><circle cx="${pas / 2}" cy="${pas / 2}" r="${rayon}" fill="${couleur}"/></pattern>`;
}

/** Décor abstrait : astre, collines et bandes, dans les deux couleurs de la série. */
function decor(alea: () => number, l: number, h: number, [sombre, clair]: [string, string], id: string): string {
  const astreX = entre(alea, l * 0.2, l * 0.8);
  const astreY = entre(alea, h * 0.15, h * 0.4);
  const rayon = entre(alea, l * 0.12, l * 0.22);
  const collines = [0.62, 0.74, 0.86]
    .map((niveau, i) => {
      const y = h * niveau;
      const a = entre(alea, -h * 0.08, h * 0.08);
      const b = entre(alea, -h * 0.08, h * 0.08);
      return `<path d="M0 ${y + a} Q ${l * 0.3} ${y - h * 0.1 + b}, ${l * 0.55} ${y + b} T ${l} ${y - a} V ${h} H 0 Z" fill="${sombre}" opacity="${0.35 + i * 0.25}"/>`;
    })
    .join("");
  const bandes = Array.from({ length: 3 }, () => {
    const x = entre(alea, 0, l);
    return `<rect x="${x}" y="0" width="${entre(alea, 6, 26)}" height="${h}" fill="${clair}" opacity="0.07" transform="rotate(${entre(alea, 8, 24)} ${x} 0)"/>`;
  }).join("");
  return `
    <defs>
      <linearGradient id="fond-${id}" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="${sombre}"/><stop offset="1" stop-color="${clair}"/>
      </linearGradient>
      ${trame(`trame-${id}`, clair, 14, 2.4)}
    </defs>
    <rect width="${l}" height="${h}" fill="url(#fond-${id})"/>
    <rect width="${l}" height="${h * 0.55}" fill="url(#trame-${id})" opacity="0.25"/>
    ${bandes}
    <circle cx="${astreX}" cy="${astreY}" r="${rayon}" fill="${clair}" opacity="0.9"/>
    <circle cx="${astreX + rayon * 0.35}" cy="${astreY - rayon * 0.2}" r="${rayon * 0.85}" fill="${sombre}" opacity="0.35"/>
    ${collines}`;
}

/** Couverture au format 2:3, avec le titre de la série. */
export async function couverture(titre: string, auteur: string, palette: [string, string], graine: string): Promise<Buffer> {
  const [l, h] = [720, 1080];
  const alea = aleatoire(`couverture-${graine}`);
  const texte = lignes(titre, 13);
  const taille = texte.length > 2 ? 64 : 78;
  const hauteurBloc = texte.length * taille * 1.08 + 96;
  const titreSvg = texte
    .map((ligne, i) => `<text x="48" y="${h - hauteurBloc + 70 + i * taille * 1.08}" font-family="${POLICE}" font-size="${taille}" font-weight="700" fill="#ffffff">${echapper(ligne)}</text>`)
    .join("");
  return versPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}" viewBox="0 0 ${l} ${h}">
    ${decor(alea, l, h, palette, "c")}
    <rect x="0" y="${h - hauteurBloc - 20}" width="${l}" height="${hauteurBloc + 20}" fill="#000000" opacity="0.55"/>
    ${titreSvg}
    <text x="48" y="${h - 40}" font-family="${POLICE}" font-size="28" fill="#ffffff" opacity="0.85">${echapper(auteur)}</text>
  </svg>`);
}

/** Bannière large du carrousel de l'accueil (le titre est ajouté par la page, pas dans l'image). */
export async function banniere(palette: [string, string], graine: string): Promise<Buffer> {
  const [l, h] = [1280, 640];
  return versPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}" viewBox="0 0 ${l} ${h}">
    ${decor(aleatoire(`banniere-${graine}`), l, h, palette, "b")}
  </svg>`);
}

/** Bulle de dialogue ovale avec sa pointe. */
function bulle(x: number, y: number, texte: string, taille: number): string {
  const rx = Math.max(70, texte.length * taille * 0.34);
  const ry = taille * 1.5;
  return `<g>
    <path d="M ${x - 12} ${y + ry - 4} L ${x - 30} ${y + ry + 26} L ${x + 14} ${y + ry - 6} Z" fill="#ffffff" stroke="#111111" stroke-width="3"/>
    <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="#111111" stroke-width="3"/>
    <text x="${x}" y="${y + taille * 0.35}" text-anchor="middle" font-family="${POLICE}" font-size="${taille}" font-weight="700" fill="#111111">${echapper(texte)}</text>
  </g>`;
}

type OptionsPlanche = {
  graine: string;
  palette: [string, string];
  repliques: string[];
  /** Mention affichée en bas de planche, ex. « Chapitre 2 · 3/6 ». */
  repere: string;
};

/** Planche de webtoon : cases en couleur empilées, à lire en défilant. */
export async function plancheWebtoon({ graine, palette, repliques, repere }: OptionsPlanche): Promise<Buffer> {
  const [l, h] = [800, 1400];
  const alea = aleatoire(`webtoon-${graine}`);
  const [sombre, clair] = palette;
  let y = 40;
  let cases = "";
  let numero = 0;
  while (y < h - 220) {
    const hauteur = Math.min(entre(alea, 300, 520), h - 120 - y);
    const id = `w${numero++}`;
    const inverse = alea() > 0.5;
    cases += `
      <defs>
        <clipPath id="clip-${id}"><rect x="40" y="${y}" width="${l - 80}" height="${hauteur}" rx="18"/></clipPath>
        <linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${inverse ? clair : sombre}"/><stop offset="1" stop-color="${inverse ? sombre : clair}"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#clip-${id})">
        <rect x="40" y="${y}" width="${l - 80}" height="${hauteur}" fill="url(#g-${id})"/>
        <circle cx="${entre(alea, 140, l - 140)}" cy="${y + hauteur * entre(alea, 0.25, 0.5)}" r="${entre(alea, 50, 110)}" fill="${inverse ? sombre : clair}" opacity="0.75"/>
        <path d="M40 ${y + hauteur * 0.72} Q ${l * 0.35} ${y + hauteur * entre(alea, 0.45, 0.7)}, ${l * 0.6} ${y + hauteur * 0.74} T ${l - 40} ${y + hauteur * 0.66} V ${y + hauteur} H 40 Z" fill="#111111" opacity="0.45"/>
        <rect x="40" y="${y}" width="${l - 80}" height="${hauteur}" fill="url(#trame)" opacity="0.18"/>
      </g>
      <rect x="40" y="${y}" width="${l - 80}" height="${hauteur}" rx="18" fill="none" stroke="#111111" stroke-width="4"/>
      ${alea() > 0.35 ? bulle(entre(alea, 220, l - 220), y + entre(alea, 70, 110), repliques[Math.floor(alea() * repliques.length)]!, 30) : ""}`;
    y += hauteur + entre(alea, 60, 130); // gouttière irrégulière : le rythme du défilement
  }
  return versPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}" viewBox="0 0 ${l} ${h}">
    <defs>${trame("trame", "#ffffff", 12, 2)}</defs>
    <rect width="${l}" height="${h}" fill="#fbf9f4"/>
    ${cases}
    <text x="${l / 2}" y="${h - 36}" text-anchor="middle" font-family="${POLICE}" font-size="24" fill="#8a8580">${echapper(repere)}</text>
  </svg>`);
}

/** Planche de manga : page en noir et blanc découpée en cases, avec trames et lignes de vitesse. */
export async function plancheManga({ graine, repliques, repere }: OptionsPlanche): Promise<Buffer> {
  const [l, h] = [900, 1350];
  const alea = aleatoire(`manga-${graine}`);
  const marge = 44;
  const gouttiere = 16;
  // Découpage : 3 ou 4 bandes horizontales, chacune partagée en 1 à 3 cases.
  const nbBandes = alea() > 0.5 ? 3 : 4;
  const poids = Array.from({ length: nbBandes }, () => entre(alea, 0.8, 1.6));
  const totalPoids = poids.reduce((a, b) => a + b, 0);
  const hauteurUtile = h - marge * 2 - 50 - gouttiere * (nbBandes - 1);
  let y = marge;
  let cases = "";
  let numero = 0;
  for (const p of poids) {
    const hauteur = (hauteurUtile * p) / totalPoids;
    const nbCases = 1 + Math.floor(alea() * 3);
    const coupes = Array.from({ length: nbCases }, () => entre(alea, 0.7, 1.5));
    const totalCoupes = coupes.reduce((a, b) => a + b, 0);
    const largeurUtile = l - marge * 2 - gouttiere * (nbCases - 1);
    let x = marge;
    for (const c of coupes) {
      const largeur = (largeurUtile * c) / totalCoupes;
      const id = `m${numero++}`;
      const style = Math.floor(alea() * 3);
      const cx = x + largeur * entre(alea, 0.3, 0.7);
      const cy = y + hauteur * entre(alea, 0.35, 0.65);
      const interieur =
        style === 0
          ? // Lignes de vitesse rayonnantes
            Array.from({ length: 26 }, (_, i) => {
              const angle = (i / 26) * Math.PI * 2;
              return `<line x1="${cx + Math.cos(angle) * 40}" y1="${cy + Math.sin(angle) * 40}" x2="${cx + Math.cos(angle) * 900}" y2="${cy + Math.sin(angle) * 900}" stroke="#111111" stroke-width="${entre(alea, 1, 4)}"/>`;
            }).join("")
          : style === 1
            ? // Silhouette ronde sur trame
              `<rect x="${x}" y="${y}" width="${largeur}" height="${hauteur}" fill="url(#trame-fine)"/><circle cx="${cx}" cy="${cy}" r="${Math.min(largeur, hauteur) * 0.28}" fill="#111111"/><circle cx="${cx + 18}" cy="${cy - 14}" r="${Math.min(largeur, hauteur) * 0.2}" fill="#ffffff"/>`
            : // Horizon et aplat noir
              `<rect x="${x}" y="${y}" width="${largeur}" height="${hauteur * 0.55}" fill="url(#trame-large)"/><path d="M ${x} ${y + hauteur * 0.6} L ${x + largeur * 0.4} ${y + hauteur * 0.42} L ${x + largeur * 0.7} ${y + hauteur * 0.58} L ${x + largeur} ${y + hauteur * 0.46} V ${y + hauteur} H ${x} Z" fill="#111111"/>`;
      cases += `
        <defs><clipPath id="clip-${id}"><rect x="${x}" y="${y}" width="${largeur}" height="${hauteur}"/></clipPath></defs>
        <g clip-path="url(#clip-${id})"><rect x="${x}" y="${y}" width="${largeur}" height="${hauteur}" fill="#ffffff"/>${interieur}</g>
        <rect x="${x}" y="${y}" width="${largeur}" height="${hauteur}" fill="none" stroke="#111111" stroke-width="5"/>
        ${largeur > 300 && alea() > 0.4 ? bulle(x + largeur * 0.5, y + 62, repliques[Math.floor(alea() * repliques.length)]!, 26) : ""}`;
      x += largeur + gouttiere;
    }
    y += hauteur + gouttiere;
  }
  return versPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}" viewBox="0 0 ${l} ${h}">
    <defs>${trame("trame-fine", "#111111", 9, 1.6)}${trame("trame-large", "#111111", 16, 3.4)}</defs>
    <rect width="${l}" height="${h}" fill="#ffffff"/>
    ${cases}
    <text x="${l / 2}" y="${h - 30}" text-anchor="middle" font-family="${POLICE}" font-size="22" fill="#555555">${echapper(repere)}</text>
  </svg>`);
}
