import { getTranslations, setRequestLocale } from "next-intl/server";
import { EnTete } from "@/components/mise-en-page/en-tete";
import { NavigationBasse } from "@/components/mise-en-page/navigation-basse";
import { PiedDePage } from "@/components/mise-en-page/pied-de-page";

/** Mise en page du site : en-tête collant, contenu, pied de page et navigation basse sur mobile. */
export default async function MiseEnPageSite({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Navigation");

  return (
    <>
      {/* Lien d'évitement : premier élément atteint au clavier */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-sur-accent"
      >
        {t("allerAuContenu")}
      </a>
      <EnTete />
      {/* pb-nav-securite : le contenu ne passe jamais sous la navigation basse */}
      <div className="pb-nav-securite flex flex-1 flex-col md:pb-0">
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <PiedDePage />
      </div>
      <NavigationBasse />
    </>
  );
}
