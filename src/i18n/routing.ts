// Langues et adresses du site.
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  // Le français n'a pas de préfixe (/catalogue) ; l'anglais est sous /en (/en/browse).
  localePrefix: "as-needed",
  // Chaque page a une adresse traduite. Dans le code, on utilise toujours la clé française.
  pathnames: {
    "/": "/",
    "/catalogue": { fr: "/catalogue", en: "/browse" },
    "/serie/[slug]": { fr: "/serie/[slug]", en: "/series/[slug]" },
    "/lire/[slug]/[numero]": { fr: "/lire/[slug]/[numero]", en: "/read/[slug]/[numero]" },
    "/bibliotheque": { fr: "/bibliotheque", en: "/library" },
    "/compte": { fr: "/compte", en: "/account" },
    "/connexion": { fr: "/connexion", en: "/login" },
    "/inscription": { fr: "/inscription", en: "/signup" },
    "/mot-de-passe-oublie": { fr: "/mot-de-passe-oublie", en: "/forgot-password" },
    "/reinitialiser-mot-de-passe": { fr: "/reinitialiser-mot-de-passe", en: "/reset-password" },
    "/design": "/design",
  },
});

export type Locale = (typeof routing.locales)[number];
/** Clé interne d'une page (toujours la forme française). */
export type Chemin = keyof typeof routing.pathnames;
/** Pages sans paramètre dans l'adresse (tout sauf /serie/[slug], /lire/[slug]/[numero]…). */
export type CheminStatique = Exclude<Chemin, `${string}[${string}`>;
