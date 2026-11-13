// Chargement des traductions pour chaque requête.
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const demandee = await requestLocale;
  const locale = hasLocale(routing.locales, demandee) ? demandee : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Fuseau utilisé pour formater les dates côté serveur (sorties de la semaine, journal).
    timeZone: "Europe/Paris",
  };
});
