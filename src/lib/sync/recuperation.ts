// Téléchargements du robot de synchronisation, avec ses garde-fous :
//  - il s'identifie clairement et ne se fait jamais passer pour un navigateur ;
//  - il respecte robots.txt et attend entre deux requêtes vers le même site ;
//  - il ne contacte aucune adresse interne (protection contre les requêtes forgées côté serveur) ;
//  - un refus du site (401, 403, 429, page de vérification) arrête l'import : rien n'est contourné.
import "server-only";
import { lookup } from "node:dns/promises";
import { env } from "@/lib/env";
import { NOM_SITE } from "@/lib/site";
import { autoriseParRobots, estAdresseInterne } from "./regles";

export const AGENT = `${NOM_SITE.replace(/\s+/g, "")}Bot/1.0 (+${env.APP_URL}/mentions-legales)`;
const DELAI_ENTRE_REQUETES_MS = 1000;
const DELAI_MAX_MS = 20_000;
const TAILLE_MAX_PAGE = 5 * 1024 * 1024;
const TAILLE_MAX_IMAGE = 25 * 1024 * 1024;

/** Erreur explicite, affichée telle quelle dans le tableau de bord des robots. */
export class ErreurSync extends Error {}

const derniereRequete = new Map<string, number>();
const robotsEnCache = new Map<string, { texte: string; lu: number }>();

async function verifierAdresse(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new ErreurSync(`Adresse refusée (protocole) : ${url.href}`);
  // En développement, SYNC_AUTORISER_LOCAL=1 permet de tester avec un serveur local. À ne jamais activer en production.
  if (process.env.SYNC_AUTORISER_LOCAL === "1" && process.env.NODE_ENV !== "production") return;
  const adresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (adresses.length === 0) throw new ErreurSync(`Site introuvable : ${url.hostname}`);
  if (adresses.some(({ address }) => estAdresseInterne(address))) throw new ErreurSync(`Adresse interne refusée : ${url.hostname}`);
}

async function attendreSonTour(hote: string) {
  const attente = (derniereRequete.get(hote) ?? 0) + DELAI_ENTRE_REQUETES_MS - Date.now();
  if (attente > 0) await new Promise((resoudre) => setTimeout(resoudre, attente));
  derniereRequete.set(hote, Date.now());
}

async function requete(url: URL, options: { tailleMax: number; enTetes?: Record<string, string>; ignorerRobots?: boolean }): Promise<Response> {
  let courante = url;
  // Les redirections sont suivies à la main pour revérifier chaque destination.
  for (let saut = 0; saut < 4; saut++) {
    await verifierAdresse(courante);
    if (!options.ignorerRobots && !(await autorise(courante))) throw new ErreurSync(`Accès interdit par le fichier robots.txt du site : ${courante.pathname}`);
    await attendreSonTour(courante.hostname);
    const reponse = await fetch(courante, { redirect: "manual", signal: AbortSignal.timeout(DELAI_MAX_MS), headers: { "User-Agent": AGENT, Accept: "*/*", ...options.enTetes } }).catch((erreur: Error) => {
      throw new ErreurSync(`Site injoignable (${courante.hostname}) : ${erreur.name === "TimeoutError" ? "délai dépassé" : erreur.message}`);
    });
    if (reponse.status >= 300 && reponse.status < 400 && reponse.headers.get("location")) {
      courante = new URL(reponse.headers.get("location")!, courante);
      continue;
    }
    if ([401, 403, 429].includes(reponse.status)) throw new ErreurSync(`Le site refuse l'accès au robot (code ${reponse.status}). Aucune protection n'est contournée : vérifiez l'autorisation avec le site.`);
    if (!reponse.ok) throw new ErreurSync(`Réponse inattendue du site (code ${reponse.status}) : ${courante.pathname}`);
    if (Number(reponse.headers.get("content-length") ?? 0) > options.tailleMax) throw new ErreurSync(`Fichier trop volumineux : ${courante.pathname}`);
    return reponse;
  }
  throw new ErreurSync(`Trop de redirections : ${url.href}`);
}

/** Vérifie le fichier robots.txt du site (mis en cache une heure). Un site sans robots.txt autorise tout. */
async function autorise(url: URL): Promise<boolean> {
  const origine = url.origin;
  let cache = robotsEnCache.get(origine);
  if (!cache || Date.now() - cache.lu > 3600_000) {
    const reponse = await requete(new URL("/robots.txt", origine), { tailleMax: 512 * 1024, ignorerRobots: true }).catch(() => null);
    cache = { texte: reponse ? await reponse.text() : "", lu: Date.now() };
    robotsEnCache.set(origine, cache);
  }
  return autoriseParRobots(cache.texte, url.pathname + url.search, AGENT);
}

/** Télécharge une page de texte (flux RSS, page HTML, réponse JSON). */
export async function telechargerTexte(adresse: string, enTetes?: Record<string, string>, ignorerRobots = false): Promise<string> {
  const reponse = await requete(new URL(adresse), { tailleMax: TAILLE_MAX_PAGE, enTetes, ignorerRobots });
  const texte = await reponse.text();
  if (texte.length > TAILLE_MAX_PAGE) throw new ErreurSync("Page trop volumineuse.");
  // Une page de vérification anti-robot n'est pas contournée : l'import s'arrête.
  if (/cf-challenge|captcha|just a moment\.\.\.|attention required/i.test(texte.slice(0, 4000))) throw new ErreurSync("Le site présente une vérification anti-robot. Aucune protection n'est contournée.");
  return texte;
}

/** Télécharge une image. `ignorerRobots` : pour les API (Drive, Discord) dont l'accès est déjà autorisé par un jeton. */
export async function telechargerImage(adresse: string, enTetes?: Record<string, string>, ignorerRobots = false): Promise<Buffer> {
  const reponse = await requete(new URL(adresse), { tailleMax: TAILLE_MAX_IMAGE, enTetes, ignorerRobots });
  const contenu = Buffer.from(await reponse.arrayBuffer());
  if (contenu.length > TAILLE_MAX_IMAGE) throw new ErreurSync("Image trop volumineuse.");
  return contenu;
}
