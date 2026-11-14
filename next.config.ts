import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Branche next-intl sur la configuration de requête (chargement des messages FR/EN).
const avecNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const configuration: NextConfig = {
  // Masque l'en-tête « X-Powered-By ».
  poweredByHeader: false,
  // Titre et description toujours placés dans l'en-tête de la page dès le premier octet :
  // tous les robots (moteurs de recherche, aperçus de liens) les lisent, pas seulement ceux que Next.js reconnaît.
  htmlLimitedBots: /.*/,
};

export default avecNextIntl(configuration);
