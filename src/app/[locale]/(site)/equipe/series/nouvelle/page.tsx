import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FormulaireSerie } from "@/components/equipe/formulaire-serie";
import { exigerConnexion } from "@/lib/session";
import { membreDe } from "@/server/acces";
import { tousLesGenres } from "@/server/catalogue";

export const metadata: Metadata = { title: "Nouvelle série", robots: { index: false } };

export default async function PageNouvelleSerie({ params, searchParams }: PageProps<"/[locale]/equipe/series/nouvelle">) {
  const { locale } = await params;
  await exigerConnexion("/equipe");
  const { equipe: equipeId } = await searchParams;
  const acces = typeof equipeId === "string" ? await membreDe(equipeId, { ecriture: true }) : null;
  if (!acces) notFound();

  const t = await getTranslations("Equipe");
  const genres = (await tousLesGenres()).map((genre) => ({ slug: genre.slug, nom: locale === "en" ? genre.nomEn : genre.nomFr }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <div>
        <p className="text-sm font-semibold text-texte-doux">{acces.equipe.nom}</p>
        <h1 className="text-3xl font-extrabold">{t("nouvelleSerie")}</h1>
      </div>
      <FormulaireSerie
        equipeId={acces.equipe.id}
        genres={genres}
        valeurs={{
          titre: "", titresAlternatifs: [], synopsis: "", type: "WEBTOON", langue: locale === "en" ? "EN" : "FR", statut: "EN_COURS",
          classification: "TOUT_PUBLIC", sensLecture: "VERTICAL", anneeParution: new Date().getFullYear(), auteurs: [], genres: [],
          droitsDeclares: false, preuveAutorisationNote: "",
        }}
      />
    </div>
  );
}
