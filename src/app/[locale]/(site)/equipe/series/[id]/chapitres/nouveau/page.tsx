import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EnvoiChapitre } from "@/components/equipe/envoi-chapitre";
import { db } from "@/lib/db";
import { exigerConnexion } from "@/lib/session";
import { membreDeLaSerie } from "@/server/acces";

export const metadata: Metadata = { title: "Nouveau chapitre", robots: { index: false } };

export default async function PageNouveauChapitre({ params, searchParams }: PageProps<"/[locale]/equipe/series/[id]/chapitres/nouveau">) {
  const { id } = await params;
  await exigerConnexion("/equipe");
  const acces = await membreDeLaSerie(id, { ecriture: true });
  if (!acces) notFound();

  const t = await getTranslations("Equipe.chapitre");
  const serie = await db.serie.findUniqueOrThrow({ where: { id }, select: { titre: true } });
  const { numero } = await searchParams;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <div>
        <p className="text-sm font-semibold text-texte-doux">{serie.titre}</p>
        <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      </div>
      <EnvoiChapitre serieId={id} numeroPropose={typeof numero === "string" && /^\d{1,5}$/.test(numero) ? numero : "1"} />
    </div>
  );
}
