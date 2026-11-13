import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Fil } from "@/components/communaute/fil";
import { VignetteListe } from "@/components/communaute/vignette-liste";
import { CarteSerie } from "@/components/serie/carte-serie";
import { LienBouton } from "@/components/ui/bouton";
import { exigerConnexion } from "@/lib/session";
import { filDActivite, listesDe, seriesSuivies } from "@/server/communaute";

export async function generateMetadata({ params }: PageProps<"/[locale]/bibliotheque">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Navigation" });
  return { title: t("bibliotheque"), robots: { index: false } };
}

export default async function PageBibliotheque() {
  const { user: compte } = await exigerConnexion("/bibliotheque");
  const t = await getTranslations("Communaute");
  const [suivies, listes, fil] = await Promise.all([seriesSuivies(compte.id), listesDe(compte.id, true), filDActivite(compte.id)]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{t("bibliotheque.titre")}</h1>
        <LienBouton href={{ pathname: "/u/[pseudo]", params: { pseudo: compte.pseudo ?? "" } }} variante="secondaire" taille="sm">
          {t("profil.voirProfil")}
        </LienBouton>
      </div>

      <section aria-labelledby="titre-suivies" className="flex flex-col gap-3">
        <h2 id="titre-suivies" className="text-xl font-bold">{t("bibliotheque.suivies")}</h2>
        {suivies.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-texte-doux">{t("bibliotheque.aucuneSuivie")}</p>
            <LienBouton href="/catalogue" variante="secondaire" taille="sm">
              {t("bibliotheque.parcourir")}
            </LienBouton>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
            {suivies.map(({ serie }) => (
              <li key={serie.slug}>
                <CarteSerie serie={serie} sizes="(min-width: 640px) 160px, 30vw" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titre-mes-listes" className="flex flex-col gap-3">
        <h2 id="titre-mes-listes" className="text-xl font-bold">{t("mesListes")}</h2>
        {listes.length === 0 ? (
          <p className="text-texte-doux">{t("aucuneListe")}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {listes.map((liste) => (
              <li key={liste.id}>
                <VignetteListe pseudo={compte.pseudo ?? ""} liste={liste} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titre-fil" className="flex flex-col gap-3">
        <h2 id="titre-fil" className="text-xl font-bold">{t("bibliotheque.fil")}</h2>
        <Fil activites={fil} vide={t("bibliotheque.filVide")} />
      </section>
    </div>
  );
}
