import { getTranslations } from "next-intl/server";
import { LienCookies } from "@/components/legal/bandeau-cookies";
import { Link } from "@/i18n/navigation";
import { NOM_SITE } from "@/lib/site";
import { Logo } from "./logo";
import { SelecteurLangue } from "./selecteur-langue";
import { SelecteurTheme } from "./selecteur-theme";

/** Pied de page : liens légaux et réglages d'affichage. */
export async function PiedDePage() {
  const t = await getTranslations("Pied");
  const tNav = await getTranslations("Navigation");

  return (
    <footer className="mt-16 border-t border-bordure">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-texte-doux">{t("droits", { annee: new Date().getFullYear(), site: NOM_SITE })}</p>
          <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-texte-doux">
            <Link href="/cgu" className="hover:text-texte hover:underline">{t("cgu")}</Link>
            <Link href="/mentions-legales" className="hover:text-texte hover:underline">{t("mentions")}</Link>
            <Link href="/confidentialite" className="hover:text-texte hover:underline">{t("confidentialite")}</Link>
            <Link href="/retrait" className="hover:text-texte hover:underline">{t("retrait")}</Link>
            <Link href="/hors-ligne" className="hover:text-texte hover:underline">{tNav("horsLigne")}</Link>
            <LienCookies>{t("cookies")}</LienCookies>
          </nav>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelecteurTheme />
          <SelecteurLangue />
        </div>
      </div>
    </footer>
  );
}
