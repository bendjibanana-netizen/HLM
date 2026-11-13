import { BellRing, BookOpen, NotebookPen, type LucideIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LienBouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";

// Accueil provisoire de la phase 1 : il présente le site en attendant le catalogue
// (carrousel, sorties de la semaine, tendances) prévu en phase 2.
export default async function PageAccueil({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Accueil");

  const atouts: { cle: "lire" | "suivre" | "partager"; icone: LucideIcon }[] = [
    { cle: "lire", icone: BookOpen },
    { cle: "suivre", icone: BellRing },
    { cle: "partager", icone: NotebookPen },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-bordure">
        {/* Trame de points en fond, estompée vers le bas */}
        <div className="trame trame-fondue absolute inset-0" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-10 pb-12 sm:pt-16 sm:pb-20">
          <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">{t("surtitre")}</p>
          <h1 className="max-w-2xl text-4xl leading-[1.05] font-extrabold sm:text-6xl">{t("titre")}</h1>
          <p className="max-w-xl text-lg text-texte-doux">{t("accroche")}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <LienBouton href="/inscription" taille="lg">
              {t("creerCompte")}
            </LienBouton>
            <LienBouton href="/catalogue" taille="lg" variante="secondaire">
              {t("parcourir")}
            </LienBouton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="titre-atouts">
        <h2 id="titre-atouts" className="mb-5 text-2xl font-bold">
          {t("atouts.titre")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {atouts.map(({ cle, icone: Icone }) => (
            <li key={cle}>
              <Carte className="flex h-full flex-col gap-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <Icone className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg font-bold">{t(`atouts.${cle}.titre`)}</h3>
                <p className="text-texte-doux">{t(`atouts.${cle}.texte`)}</p>
              </Carte>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
