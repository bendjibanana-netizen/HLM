import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Carte } from "@/components/ui/carte";
import { db } from "@/lib/db";
import { exigerConnexion } from "@/lib/session";
import { membreDe } from "@/server/acces";
import { GraphiqueTraduit } from "./graphique-traduit";

export const metadata: Metadata = { title: "Statistiques", robots: { index: false } };

export default async function PageStatistiques({ searchParams }: PageProps<"/[locale]/equipe/statistiques">) {
  await exigerConnexion("/equipe");
  const { equipe: equipeId } = await searchParams;
  const acces = typeof equipeId === "string" ? await membreDe(equipeId) : null;
  if (!acces) notFound();

  const t = await getTranslations("Stats");
  const format = await getFormatter();
  const aujourdhui = new Date(new Date().toISOString().slice(0, 10));
  const debut = new Date(aujourdhui.getTime() - 29 * 24 * 60 * 60 * 1000);
  const periode = { equipeId: acces.equipe.id, date: { gte: debut } };

  const [parJour, parSerie, parChapitre, series] = await Promise.all([
    db.vueJournaliere.groupBy({ by: ["date"], where: periode, _sum: { nbVues: true } }),
    db.vueJournaliere.groupBy({ by: ["serieId"], where: periode, _sum: { nbVues: true } }),
    db.vueJournaliere.groupBy({ by: ["chapitreId"], where: periode, _sum: { nbVues: true }, orderBy: { _sum: { nbVues: "desc" } }, take: 10 }),
    db.serie.findMany({ where: { equipeId: acces.equipe.id }, orderBy: { nbVues: "desc" }, select: { id: true, titre: true, nbVues: true, nbAbonnes: true, noteMoyenne: true, nbNotes: true } }),
  ]);
  const chapitres = await db.chapitre.findMany({ where: { id: { in: parChapitre.map((c) => c.chapitreId) } }, select: { id: true, numero: true, serie: { select: { titre: true } } } });

  // Les 30 jours sont tous présents, y compris ceux sans vue.
  const points = Array.from({ length: 30 }, (_, i) => {
    const jour = new Date(debut.getTime() + i * 24 * 60 * 60 * 1000);
    const vues = parJour.find((v) => v.date.getTime() === jour.getTime())?._sum.nbVues ?? 0;
    return { jour: jour.toISOString().slice(0, 10), libelle: format.dateTime(jour, { day: "numeric", month: "short", timeZone: "UTC" }), vues };
  });
  const vues30 = points.reduce((somme, p) => somme + p.vues, 0);
  const notees = series.filter((s) => s.nbNotes > 0);
  const tuiles = [
    { libelle: t("vues30"), valeur: format.number(vues30) },
    { libelle: t("vuesTotal"), valeur: format.number(series.reduce((s, x) => s + x.nbVues, 0)) },
    { libelle: t("abonnes"), valeur: format.number(series.reduce((s, x) => s + x.nbAbonnes, 0)) },
    { libelle: t("noteMoyenne"), valeur: notees.length ? `${format.number(notees.reduce((s, x) => s + x.noteMoyenne, 0) / notees.length / 2, { maximumFractionDigits: 1 })} / 5` : "—" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <div>
        <p className="text-sm font-semibold text-texte-doux">{acces.equipe.nom}</p>
        <h1 className="text-3xl font-extrabold">{t("statistiques")}</h1>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tuiles.map((tuile) => (
          <Carte key={tuile.libelle} className="flex flex-col gap-1">
            <dt className="text-sm text-texte-doux">{tuile.libelle}</dt>
            <dd className="font-titre text-2xl font-extrabold tabular-nums">{tuile.valeur}</dd>
          </Carte>
        ))}
      </dl>

      <Carte className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">{t("evolution")}</h2>
          <p className="text-sm text-texte-doux">{t("evolutionAide")}</p>
        </div>
        {vues30 === 0 ? <p className="text-texte-doux">{t("aucuneVue")}</p> : <GraphiqueTraduit points={points} />}
      </Carte>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{t("parSerie")}</h2>
        <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-texte-doux">
                <th className="p-3 font-semibold">{t("serie")}</th>
                <th className="p-3 text-right font-semibold">{t("vues30")}</th>
                <th className="p-3 text-right font-semibold">{t("abonnes")}</th>
                <th className="p-3 text-right font-semibold">{t("noteMoyenne")}</th>
              </tr>
            </thead>
            <tbody>
              {series.map((serie) => (
                <tr key={serie.id} className="border-t border-bordure">
                  <td className="p-3 font-semibold">{serie.titre}</td>
                  <td className="p-3 text-right">{format.number(parSerie.find((v) => v.serieId === serie.id)?._sum.nbVues ?? 0)}</td>
                  <td className="p-3 text-right">{format.number(serie.nbAbonnes)}</td>
                  <td className="p-3 text-right">{serie.nbNotes > 0 ? `${format.number(serie.noteMoyenne / 2, { maximumFractionDigits: 1 })} (${serie.nbNotes})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {parChapitre.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t("parChapitre")}</h2>
          <ol className="flex flex-col gap-1.5">
            {parChapitre.map((ligne) => {
              const chapitre = chapitres.find((c) => c.id === ligne.chapitreId);
              return (
                <li key={ligne.chapitreId} className="flex items-center justify-between gap-3 rounded-xl border border-bordure bg-surface px-3 py-2 text-sm">
                  <span className="truncate font-semibold">{chapitre ? `${chapitre.serie.titre} — ${chapitre.numero}` : "—"}</span>
                  <span className="shrink-0 tabular-nums">{t("vuesJour", { nombre: ligne._sum.nbVues ?? 0 })}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
