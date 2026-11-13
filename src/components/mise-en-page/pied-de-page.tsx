import { getTranslations } from "next-intl/server";
import { NOM_SITE } from "@/lib/site";
import { Logo } from "./logo";
import { SelecteurLangue } from "./selecteur-langue";
import { SelecteurTheme } from "./selecteur-theme";

/** Pied de page : réglages d'affichage. Les liens légaux s'y ajouteront en phase 5. */
export async function PiedDePage() {
  const t = await getTranslations("Pied");

  return (
    <footer className="mt-16 border-t border-bordure">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-texte-doux">{t("droits", { annee: new Date().getFullYear(), site: NOM_SITE })}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelecteurTheme />
          <SelecteurLangue />
        </div>
      </div>
    </footer>
  );
}
