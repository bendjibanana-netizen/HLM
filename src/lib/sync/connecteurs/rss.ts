// Connecteur RSS / Atom : chaque entrée du flux est un chapitre, ses images sont celles du contenu de l'entrée.
import "server-only";
import { load } from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { ErreurSync, telechargerImage, telechargerTexte } from "../recuperation";
import { extraireNumero } from "../regles";
import { IMAGES_MAX_PAR_CHAPITRE, type Connecteur } from "./types";

const enListe = <T>(valeur: T | T[] | undefined): T[] => (valeur === undefined ? [] : Array.isArray(valeur) ? valeur : [valeur]);
const texteDe = (valeur: unknown): string => (typeof valeur === "string" ? valeur : valeur && typeof valeur === "object" && "#text" in valeur ? String((valeur as { "#text": unknown })["#text"]) : "");

export const lireRss: Connecteur = async ({ url }) => {
  if (!url) throw new ErreurSync("Adresse du flux manquante.");
  const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" }).parse(await telechargerTexte(url)) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const entrees = enListe<Record<string, any>>(xml.rss?.channel?.item ?? xml.feed?.entry); // eslint-disable-line @typescript-eslint/no-explicit-any
  if (entrees.length === 0) throw new ErreurSync("Flux illisible ou vide : aucune entrée trouvée (le format du flux a peut-être changé).");

  return entrees.flatMap((entree) => {
    const titre = texteDe(entree.title).trim();
    const numero = extraireNumero(titre);
    const lien = typeof entree.link === "string" ? entree.link : (enListe<Record<string, string>>(entree.link)[0]?.["@href"] ?? "");
    const identifiant = texteDe(entree.guid) || texteDe(entree.id) || lien;
    if (!numero || !identifiant) return [];

    // Images : pièces jointes du flux, puis balises <img> du contenu de l'entrée.
    const jointes = [...enListe<Record<string, string>>(entree.enclosure), ...enListe<Record<string, string>>(entree["media:content"])]
      .filter((piece) => (piece["@type"] ?? "image/").startsWith("image/") && piece["@url"])
      .map((piece) => piece["@url"]!);
    const html = texteDe(entree["content:encoded"]) || texteDe(entree.content) || texteDe(entree.description);
    const dansLeContenu = load(html)("img").map((_, image) => image.attribs.src).get().filter(Boolean);
    const adresses = [...new Set([...jointes, ...dansLeContenu])].map((adresse) => new URL(adresse, url).href).slice(0, IMAGES_MAX_PAR_CHAPITRE);
    if (adresses.length === 0) return [];

    return [{ identifiantExterne: identifiant, numero, titre: titre || null, images: async () => { const images: Buffer[] = []; for (const adresse of adresses) images.push(await telechargerImage(adresse)); return images; } }];
  });
};
