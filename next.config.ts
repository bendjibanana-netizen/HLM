import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Branche next-intl sur la configuration de requête (chargement des messages FR/EN).
const avecNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const configuration: NextConfig = {
  // Masque l'en-tête « X-Powered-By ».
  poweredByHeader: false,
};

export default avecNextIntl(configuration);
