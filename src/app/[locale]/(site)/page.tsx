import { LibraryBig } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Carrousel } from "@/components/accueil/carrousel";
import { RangeeSeries } from "@/components/accueil/rangee-series";
import { ReprendreLecture } from "@/components/accueil/reprendre-lecture";
import { SortiesSemaine } from "@/components/accueil/sorties-semaine";
import { EmplacementPub } from "@/components/pub/emplacement";
import { EtatVide } from "@/components/ui/etat-vide";
import { misesEnAvant, seriesMieuxNotees, seriesNouveautes, seriesTendances, sortiesDeLaSemaine } from "@/server/catalogue";

// Le contenu change à chaque publication : la page est rendue à la demande.
// La mise en cache sera réglée en phase 7 (performances).
export const dynamic = "force-dynamic";

export default async function PageAccueil({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Accueil");

  const [vedettes, sorties, tendances, nouveautes, mieuxNotees] = await Promise.all([
    misesEnAvant(),
    sortiesDeLaSemaine(),
    seriesTendances(),
    seriesNouveautes(),
    seriesMieuxNotees(),
  ]);

  if (tendances.length === 0) {
    return (
      <EtatVide icone={LibraryBig} titre={t("vide")}>
        {process.env.NODE_ENV !== "production" && t("videAide")}
      </EtatVide>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      <h1 className="sr-only">{t("aLaUne")}</h1>
      <Carrousel vedettes={vedettes} />
      <ReprendreLecture />
      <SortiesSemaine sorties={sorties} />
      <EmplacementPub cle="accueil-milieu" />
      <RangeeSeries titre={t("tendances")} series={tendances} tri="tendances" />
      <RangeeSeries titre={t("nouveautes")} series={nouveautes} tri="recent" />
      <RangeeSeries titre={t("mieuxNotees")} series={mieuxNotees} tri="note" />
    </div>
  );
}
