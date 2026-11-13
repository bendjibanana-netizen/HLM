import { ChevronLeft, ChevronRight, SearchX, ServerCrash } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FormulaireFiltres } from "@/components/catalogue/formulaire-filtres";
import { PanneauFiltres } from "@/components/catalogue/panneau-filtres";
import { CarteSerie } from "@/components/serie/carte-serie";
import { EmplacementPub } from "@/components/pub/emplacement";
import { classesBouton } from "@/components/ui/bouton";
import { EtatVide } from "@/components/ui/etat-vide";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { chercherSeries, type ResultatRecherche } from "@/lib/recherche/chercher";
import { lireCriteres, type Criteres } from "@/lib/recherche/criteres";
import { tousLesGenres } from "@/server/catalogue";

export async function generateMetadata({ params }: PageProps<"/[locale]/catalogue">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Catalogue" });
  return { title: t("titre") };
}

/** Paramètres d'URL correspondant aux critères, pour les liens de pagination. */
function versParametres(criteres: Criteres, page: number) {
  return {
    ...(criteres.requete && { q: criteres.requete }),
    tri: criteres.tri,
    ...(criteres.types.length && { type: criteres.types }),
    ...(criteres.langues.length && { langue: criteres.langues }),
    ...(criteres.statuts.length && { statut: criteres.statuts }),
    ...(criteres.classifications.length && { classification: criteres.classifications }),
    ...(criteres.genres.length && { genre: criteres.genres }),
    ...(criteres.noteMin > 0 && { note: String(criteres.noteMin) }),
    ...(page > 1 && { page: String(page) }),
  };
}

export default async function PageCatalogue({ params, searchParams }: PageProps<"/[locale]/catalogue">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Catalogue");

  const criteres = lireCriteres(await searchParams);
  const genres = (await tousLesGenres()).map((genre) => ({ slug: genre.slug, nom: locale === "en" ? genre.nomEn : genre.nomFr }));

  // Si le moteur de recherche est injoignable, la page l'explique au lieu de planter.
  let resultat: ResultatRecherche | null = null;
  try {
    resultat = await chercherSeries(criteres);
  } catch (erreur) {
    console.error("[catalogue] recherche indisponible :", erreur);
  }

  const nbFiltres =
    criteres.types.length + criteres.langues.length + criteres.statuts.length + criteres.classifications.length + criteres.genres.length + (criteres.noteMin > 0 ? 1 : 0);
  const action = getPathname({ href: "/catalogue", locale: locale as Locale });
  const filtres = <FormulaireFiltres action={action} criteres={criteres} genres={genres} />;

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-5">
      {/* Grand écran : filtres dans une colonne fixe */}
      <aside className="hidden w-64 shrink-0 md:block">{filtres}</aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
            {resultat && (
              <p className="text-texte-doux" role="status">
                {t("resultats", { nombre: resultat.total })}
                {criteres.requete && ` ${t("pour", { requete: criteres.requete })}`}
              </p>
            )}
          </div>
          {/* Mobile : les mêmes filtres dans un panneau */}
          <PanneauFiltres libelle={t("filtres")} libelleFermer={t("fermer")} nbActifs={nbFiltres}>
            {filtres}
          </PanneauFiltres>
        </div>

        {!resultat ? (
          <EtatVide icone={ServerCrash} titre={t("indisponible")}>
            {t("indisponibleAide")}
          </EtatVide>
        ) : resultat.series.length === 0 ? (
          <EtatVide icone={SearchX} titre={t("aucun")}>
            {t("aucunAide")}
          </EtatVide>
        ) : (
          <>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
              {resultat.series.map((serie, index) => (
                <li key={serie.id}>
                  <CarteSerie serie={serie} sizes="(min-width: 1024px) 160px, (min-width: 640px) 22vw, 30vw" prioritaire={index < 6} />
                </li>
              ))}
            </ul>
            {resultat.pages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2">
                {criteres.page > 1 ? (
                  <Link href={{ pathname: "/catalogue", query: versParametres(criteres, criteres.page - 1) }} className={classesBouton({ variante: "secondaire" })}>
                    <ChevronLeft className="size-4" aria-hidden />
                    {t("precedente")}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-texte-doux">{t("page", { page: criteres.page, pages: resultat.pages })}</span>
                {criteres.page < resultat.pages ? (
                  <Link href={{ pathname: "/catalogue", query: versParametres(criteres, criteres.page + 1) }} className={classesBouton({ variante: "secondaire" })}>
                    {t("suivante")}
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
        <EmplacementPub cle="catalogue-bas" />
      </div>
    </div>
  );
}
