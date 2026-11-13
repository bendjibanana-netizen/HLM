import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { DecisionSerie } from "@/components/equipe/decision-serie";
import { Signalements } from "@/components/moderation/signalements";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Badge, BadgeClassification } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";

export const metadata: Metadata = { title: "Modération", robots: { index: false } };

export default async function PageModeration() {
  await exigerRole("MODERATEUR", "/moderation");
  const t = await getTranslations();
  const format = await getFormatter();
  const series = await db.serie.findMany({
    where: { statutModeration: "EN_ATTENTE" },
    orderBy: { majLe: "asc" },
    include: { equipe: { select: { nom: true, nbRetraitsJustifies: true } }, droitsDeclaresPar: { select: { name: true } }, _count: { select: { chapitres: true } } },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("Moderation.titre")}</h1>
      <Signalements />
      <h2 className="text-xl font-bold">
        {t("Moderation.seriesEnAttente")} <span className="text-base text-texte-doux">({series.length})</span>
      </h2>
      {series.length === 0 && <p className="text-texte-doux">{t("Moderation.aucune")}</p>}
      {series.map((serie) => (
        <Carte key={serie.id} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="w-20 shrink-0">
              <ImageCouverture cle={serie.couvertureCle} couleur={serie.couleurDominante} alt="" sizes="80px" />
            </div>
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <h3 className="text-xl font-bold">{serie.titre}</h3>
              <p className="text-sm text-texte-doux">
                {t("Moderation.equipe")} : {serie.equipe.nom} · {t("Serie.chapitres", { nombre: serie._count.chapitres })}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{t(`Type.${serie.type}`)}</Badge>
                <BadgeClassification classification={serie.classification} />
              </div>
              <Link href={{ pathname: "/serie/[slug]", params: { slug: serie.slug } }} className="text-sm font-semibold text-accent hover:underline">
                {t("Moderation.apercu")}
              </Link>
            </div>
          </div>
          <p className="line-clamp-4 text-sm">{serie.synopsis}</p>
          <div className="flex flex-col gap-1 rounded-xl bg-surface-2 p-3 text-sm">
            <p className="font-semibold">
              {t("Moderation.declaration", { date: serie.droitsDeclaresLe ? format.dateTime(serie.droitsDeclaresLe, { dateStyle: "long" }) : "?", nom: serie.droitsDeclaresPar?.name ?? "?" })}
            </p>
            {serie.preuveAutorisationNote && (
              <p>
                <span className="text-texte-doux">{t("Moderation.note")} : </span>
                {serie.preuveAutorisationNote}
              </p>
            )}
            {serie.preuveAutorisationCle ? (
              // Lien direct vers la route d'API : fichier privé servi après contrôle du rôle.
              <a href={`/api/moderation/preuve?serie=${serie.id}`} target="_blank" rel="noopener" className="font-semibold text-accent hover:underline">
                {t("Moderation.preuve")}
              </a>
            ) : (
              <p className="text-texte-doux">{t("Moderation.sansPreuve")}</p>
            )}
          </div>
          <DecisionSerie serieId={serie.id} libelles={{ valider: t("Moderation.valider"), refuser: t("Moderation.refuser"), motif: t("Moderation.motif"), motifRequis: t("Moderation.motifRequis") }} />
        </Carte>
      ))}
    </div>
  );
}
