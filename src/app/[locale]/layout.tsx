import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BandeauCookies } from "@/components/legal/bandeau-cookies";
import { EnregistrementServiceWorker } from "@/components/pwa/enregistrement";
import { routing } from "@/i18n/routing";
import { NOM_SITE } from "@/lib/site";
import "../globals.css";

// Police des titres, hébergée avec le site (aucune requête vers Google à l'exécution).
const policeTitre = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--police-titre",
  display: "swap",
});

// Applique le thème choisi par le lecteur avant le premier affichage, pour éviter un flash.
// Signale aussi qu'un choix de cookies existe déjà, pour masquer le bandeau avant le premier affichage.
const SCRIPT_THEME = `try{var t=localStorage.getItem("theme");if(t==="clair"||t==="sombre")document.documentElement.dataset.theme=t}catch(e){}if(/(^|; )consentement=v1/.test(document.cookie))document.documentElement.dataset.consentement="fait"`;

const ORIGINE_IMAGES = new URL(process.env.NEXT_PUBLIC_URL_IMAGES || "http://localhost:9000/hlm").origin;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
    title: { default: t("titre", { site: NOM_SITE }), template: `%s — ${NOM_SITE}` },
    description: t("description"),
    applicationName: NOM_SITE,
    icons: { icon: "/icones/icone-192.png", apple: "/icones/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: NOM_SITE, statusBarStyle: "black-translucent" },
    openGraph: { siteName: NOM_SITE, type: "website", locale: locale === "en" ? "en_US" : "fr_FR" },
    // Chaque page indique son équivalent dans l'autre langue aux moteurs de recherche.
    alternates: { languages: { fr: "/", en: "/en" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Le site s'étend sous l'encoche ; les marges de sécurité sont gérées en CSS.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e12" },
  ],
};

export default async function MiseEnPageRacine({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Permet le rendu statique des pages qui ne dépendent pas de la session.
  setRequestLocale(locale);

  return (
    // suppressHydrationWarning : l'attribut data-theme est posé par le script avant l'hydratation.
    <html lang={locale} className={policeTitre.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
        {/* Ouvre d'avance la connexion vers le domaine des images (CDN) : la première image arrive plus tôt. */}
        <link rel="preconnect" href={ORIGINE_IMAGES} crossOrigin="anonymous" />
      </head>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          {children}
          <BandeauCookies />
          <EnregistrementServiceWorker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
