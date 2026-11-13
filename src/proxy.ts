// Exécuté avant chaque page : détecte la langue du visiteur et applique les adresses traduites.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Tout sauf l'API, les fichiers internes de Next.js et les fichiers statiques (avec extension).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
