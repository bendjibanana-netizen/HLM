import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Actualisation } from "@/components/equipe/actualisation";
import { BoutonAction } from "@/components/equipe/bouton-action";
import { etatSource } from "@/components/equipe/sources-serie";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { Message } from "@/components/ui/message";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";
import { piloterSource } from "@/server/actions/sync";

export const metadata: Metadata = { title: "Robots de synchronisation", robots: { index: false } };

export default async function PageBots() {
  await exigerRole("ADMIN", "/admin");
  const t = await getTranslations();
  const format = await getFormatter();
  const [sources, executions] = await Promise.all([
    db.sourceSync.findMany({ orderBy: [{ valideeLe: { sort: "asc", nulls: "first" } }, { creeLe: "desc" }], include: { equipe: { select: { nom: true } }, serie: { select: { titre: true } } } }),
    db.executionSync.findMany({ orderBy: { debutLe: "desc" }, take: 40, include: { source: { select: { nom: true } } } }),
  ]);
  const date = (valeur: Date) => format.dateTime(valeur, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
      {/* La page se met à jour seule tant qu'un passage est en cours. */}
      <Actualisation active={executions.some((e) => e.statut === "EN_COURS")} />
      <h1 className="text-3xl font-extrabold">{t("Admin.bots")}</h1>
      <Message>{t("Admin.bot.intro")}</Message>

      <h2 className="text-xl font-bold">
        {t("Admin.bot.sources")} <span className="text-base text-texte-doux">({sources.length})</span>
      </h2>
      {sources.length === 0 && <p className="text-texte-doux">{t("Admin.bot.aucune")}</p>}
      {sources.map((source) => {
        const etat = etatSource(source);
        return (
          <Carte key={source.id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">{source.nom}</h3>
              <Badge ton={etat.ton}>{t(`Sync.etats.${etat.cle}`)}</Badge>
            </div>
            <dl className="grid gap-1 text-sm">
              <div><dt className="inline text-texte-doux">{t("Sync.type")} : </dt><dd className="inline font-semibold">{t(`Sync.types.${source.type}`)}</dd></div>
              <div><dt className="inline text-texte-doux">{t("Admin.bot.equipe")} : </dt><dd className="inline font-semibold">{source.equipe.nom}</dd></div>
              <div><dt className="inline text-texte-doux">{t("Admin.bot.serie")} : </dt><dd className="inline font-semibold">{source.serie?.titre ?? "—"}</dd></div>
              {source.url && <div className="break-all"><dt className="inline text-texte-doux">URL : </dt><dd className="inline">{source.url}</dd></div>}
              <div><dt className="inline text-texte-doux">{t("Admin.bot.autorisation")} : </dt><dd className="inline">{source.autorisationNote}</dd></div>
            </dl>
            <p className="text-sm text-texte-doux">
              {source.dernierPassageLe ? t("Sync.dernierPassage", { date: date(source.dernierPassageLe) }) : t("Sync.jamais")}
              {source.erreursConsecutives > 0 && ` · ${t("Admin.bot.erreursSuite", { nombre: source.erreursConsecutives })}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {!source.valideeLe && <BoutonAction action={piloterSource.bind(null, source.id, "VALIDER")} variante="primaire" espace="Sync.erreurs">{t("Admin.bot.valider")}</BoutonAction>}
              {source.valideeLe && <BoutonAction action={piloterSource.bind(null, source.id, "RELANCER")} espace="Sync.erreurs" succes={t("Admin.bot.relancee")}>{t("Admin.bot.relancer")}</BoutonAction>}
              {source.valideeLe && source.actif && <BoutonAction action={piloterSource.bind(null, source.id, "PAUSE")} espace="Sync.erreurs">{t("Admin.bot.pause")}</BoutonAction>}
              {source.valideeLe && !source.actif && <BoutonAction action={piloterSource.bind(null, source.id, "ACTIVER")} espace="Sync.erreurs">{t("Admin.bot.activer")}</BoutonAction>}
              <BoutonAction action={piloterSource.bind(null, source.id, "SUPPRIMER")} variante="danger" confirmation={t("Admin.bot.confirmer")} espace="Sync.erreurs">{t("Admin.bot.supprimer")}</BoutonAction>
            </div>
          </Carte>
        );
      })}

      <h2 className="mt-2 text-xl font-bold">{t("Admin.bot.historique")}</h2>
      {executions.length === 0 && <p className="text-texte-doux">{t("Admin.bot.aucunPassage")}</p>}
      <ul className="flex flex-col gap-2">
        {executions.map((execution) => (
          <li key={execution.id} className="flex flex-col gap-1 rounded-xl border border-bordure bg-surface p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{execution.source.nom}</span>
              <Badge ton={execution.statut === "REUSSIE" ? "succes" : execution.statut === "ECHOUEE" ? "danger" : "alerte"}>{t(`Admin.bot.statuts.${execution.statut}`)}</Badge>
            </div>
            <p className="text-texte-doux">
              {date(execution.debutLe)} · {t("Admin.bot.detectes", { nombre: execution.nbDetectes })} · {t("Admin.bot.importes", { nombre: execution.nbImportes })}
              {execution.declencheeParId && ` · ${t("Admin.bot.manuel")}`}
            </p>
            {execution.erreur && <p className="text-danger">{execution.erreur}</p>}
            {Array.isArray(execution.journal) && (execution.journal as string[]).map((ligne, index) => <p key={index}>{ligne}</p>)}
          </li>
        ))}
      </ul>
    </div>
  );
}
