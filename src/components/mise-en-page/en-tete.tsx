import { getLocale, getTranslations } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import { NOM_SITE } from "@/lib/site";
import { BarreRecherche } from "./barre-recherche";
import { BoutonCompte } from "./bouton-compte";
import { LiensEntete } from "./liens-entete";
import { Logo } from "./logo";

/** En-tête collant : emblème, recherche toujours visible et accès au compte. */
export async function EnTete() {
  const t = await getTranslations("Navigation");
  const locale = await getLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-bordure bg-fond/95 backdrop-blur">
      <nav aria-label={t("principale")} className="mx-auto flex h-entete max-w-6xl items-center gap-3 px-3 sm:px-4">
        <Link href="/" aria-label={`${NOM_SITE} — ${t("accueil")}`} className="shrink-0 rounded-lg">
          {/* Le nom n'apparaît qu'à partir de la tablette : sur mobile, la place va à la recherche */}
          <Logo avecNom={false} className="md:hidden" />
          <Logo className="hidden md:inline-flex" />
        </Link>
        <LiensEntete />
        <BarreRecherche action={getPathname({ href: "/catalogue", locale })} className="md:ml-auto md:max-w-xs" />
        <BoutonCompte />
      </nav>
    </header>
  );
}
