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
    "/u/[pseudo]": "/u/[pseudo]",
    "/u/[pseudo]/liste/[slug]": { fr: "/u/[pseudo]/liste/[slug]", en: "/u/[pseudo]/list/[slug]" },
    "/compte": { fr: "/compte", en: "/account" },
    "/notifications": "/notifications",
    "/hors-ligne": { fr: "/hors-ligne", en: "/offline" },
    "/connexion": { fr: "/connexion", en: "/login" },
    "/inscription": { fr: "/inscription", en: "/signup" },
    "/mot-de-passe-oublie": { fr: "/mot-de-passe-oublie", en: "/forgot-password" },
    "/reinitialiser-mot-de-passe": { fr: "/reinitialiser-mot-de-passe", en: "/reset-password" },
    "/design": "/design",
    "/cgu": { fr: "/cgu", en: "/terms" },
    "/mentions-legales": { fr: "/mentions-legales", en: "/legal-notice" },
    "/confidentialite": { fr: "/confidentialite", en: "/privacy" },
    "/retrait": { fr: "/retrait", en: "/takedown" },
    // Espaces de travail : mêmes adresses dans les deux langues.
    "/invitation/[jeton]": "/invitation/[jeton]",
    "/equipe": { fr: "/equipe", en: "/team" },
    "/equipe/series/nouvelle": { fr: "/equipe/series/nouvelle", en: "/team/series/new" },
    "/equipe/series/[id]": { fr: "/equipe/series/[id]", en: "/team/series/[id]" },
    "/equipe/series/[id]/chapitres/nouveau": { fr: "/equipe/series/[id]/chapitres/nouveau", en: "/team/series/[id]/chapters/new" },
    "/admin": "/admin",
    "/admin/invitations": "/admin/invitations",
    "/admin/retraits": "/admin/retraits",
    "/admin/bots": "/admin/bots",
    "/admin/publicite": "/admin/publicite",
    "/admin/revenus": "/admin/revenus",
    "/equipe/statistiques": { fr: "/equipe/statistiques", en: "/team/stats" },
    "/equipe/revenus": { fr: "/equipe/revenus", en: "/team/revenue" },
    "/moderation": "/moderation",
  },
});

export type Locale = (typeof routing.locales)[number];
/** Clé interne d'une page (toujours la forme française). */
export type Chemin = keyof typeof routing.pathnames;
/** Pages sans paramètre dans l'adresse (tout sauf /serie/[slug], /lire/[slug]/[numero]…). */
export type CheminStatique = Exclude<Chemin, `${string}[${string}`>;
