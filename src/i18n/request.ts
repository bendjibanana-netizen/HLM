// Chargement des traductions pour chaque requête.
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Messages = { [cle: string]: string | Messages };

/** Complète les traductions d'une langue par le français pour toute clé absente. */
function completer(base: Messages, traduction: Messages): Messages {
  const resultat: Messages = { ...base };
  for (const [cle, valeur] of Object.entries(traduction)) {
    const existant = base[cle];
    resultat[cle] = typeof valeur === "object" && typeof existant === "object" ? completer(existant, valeur) : valeur;
  }
  return resultat;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const demandee = await requestLocale;
  const locale = hasLocale(routing.locales, demandee) ? demandee : routing.defaultLocale;

  // Les écrans d'administration et de modération n'existent qu'en français :
  // dans les autres langues, les clés manquantes reprennent le texte français.
  const francais = (await import("../../messages/fr.json")).default as Messages;
  const messages = locale === "fr" ? francais : completer(francais, (await import(`../../messages/${locale}.json`)).default as Messages);

  return {
    locale,
    messages,
    // Fuseau utilisé pour formater les dates côté serveur (sorties de la semaine, journal).
    timeZone: "Europe/Paris",
  };
});
