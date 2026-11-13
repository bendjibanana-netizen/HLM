// Connecteur « site autorisé » : lit la page d'une série sur un site dont l'ayant droit a donné son accord.
// La page liste les chapitres (sélecteur CSS des liens) ; chaque chapitre contient ses images (sélecteur CSS).
import "server-only";
import { load } from "cheerio";
import { ErreurSync, telechargerImage, telechargerTexte } from "../recuperation";
import { extraireNumero } from "../regles";
import { IMAGES_MAX_PAR_CHAPITRE, type Connecteur } from "./types";

export const lireSite: Connecteur = async ({ url, config }) => {
  if (!url) throw new ErreurSync("Adresse de la page manquante.");
  const selecteurChapitres = String(config.selecteurChapitres ?? "").trim();
  const selecteurImages = String(config.selecteurImages ?? "").trim();
  if (!selecteurChapitres || !selecteurImages) throw new ErreurSync("Sélecteurs CSS manquants dans la configuration de la source.");

  const $ = load(await telechargerTexte(url));
  const liens = $(selecteurChapitres)
    .map((_, lien) => ({ href: $(lien).attr("href") ?? "", texte: $(lien).text().trim() }))
    .get()
    .filter((lien) => lien.href);
  // Aucun lien trouvé alors que la page a répondu : le site a très probablement changé de mise en page.
  if (liens.length === 0) throw new ErreurSync(`Aucun chapitre trouvé avec le sélecteur « ${selecteurChapitres} » : la mise en page du site a peut-être changé.`);

  return liens.flatMap(({ href, texte }) => {
    const adresse = new URL(href, url).href;
    const numero = extraireNumero(texte) ?? extraireNumero(decodeURIComponent(new URL(adresse).pathname.replace(/\/$/, "")));
    if (!numero) return [];
    return [
      {
        identifiantExterne: adresse,
        numero,
        titre: null,
        images: async () => {
          const page = load(await telechargerTexte(adresse));
          const sources = page(selecteurImages)
            .map((_, image) => page(image).attr("data-src") ?? page(image).attr("src") ?? "")
            .get()
            .filter(Boolean)
            .slice(0, IMAGES_MAX_PAR_CHAPITRE);
          if (sources.length === 0) throw new ErreurSync(`Aucune image trouvée avec le sélecteur « ${selecteurImages} » : la mise en page du site a peut-être changé.`);
          const images: Buffer[] = [];
          for (const source of sources) images.push(await telechargerImage(new URL(source, adresse).href));
          return images;
        },
      },
    ];
  });
};
