import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { db } from "@/lib/db";
import { retirerSource } from "@/server/actions/sync";
import { BoutonAction } from "./bouton-action";
import { FormulaireSource } from "./formulaire-source";

/** État d'une source, du point de vue de l'équipe comme de l'admin. */
export function etatSource(source: { valideeLe: Date | null; actif: boolean; erreursConsecutives: number }) {
  if (!source.valideeLe) return { cle: "ATTENTE", ton: "alerte" } as const;
  if (!source.actif) return { cle: "PAUSE", ton: "neutre" } as const;
  return source.erreursConsecutives > 0 ? ({ cle: "ERREUR", ton: "danger" } as const) : ({ cle: "ACTIVE", ton: "succes" } as const);
}

/** Section « Synchronisation automatique » de la page de gestion d'une série. */
export async function SourcesSerie({ serieId, modifiable }: { serieId: string; modifiable: boolean }) {
  const t = await getTranslations("Sync");
  const format = await getFormatter();
  const sources = await db.sourceSync.findMany({ where: { serieId }, orderBy: { creeLe: "asc" }, include: { executions: { orderBy: { debutLe: "desc" }, take: 1, select: { erreur: true } } } });

  return (
    <Carte className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">{t("titre")}</h2>
      <p className="text-sm text-texte-doux">{t("intro")}</p>
      {sources.length === 0 ? (
        <p className="text-sm text-texte-doux">{t("aucune")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sources.map((source) => {
            const etat = etatSource(source);
            return (
              <li key={source.id} className="flex flex-col gap-1.5 rounded-xl border border-bordure p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {source.nom} <span className="font-normal text-texte-doux">· {t(`types.${source.type}`)}</span>
                  </span>
                  <Badge ton={etat.ton}>{t(`etats.${etat.cle}`)}</Badge>
                </div>
                <p className="text-texte-doux">{source.dernierPassageLe ? t("dernierPassage", { date: format.dateTime(source.dernierPassageLe, { dateStyle: "medium", timeStyle: "short" }) }) : t("jamais")}</p>
                {etat.cle === "ERREUR" && source.executions[0]?.erreur && <p className="text-danger">{source.executions[0].erreur}</p>}
                <BoutonAction action={retirerSource.bind(null, source.id)} variante="discret" espace="Sync.erreurs">
                  {t("retirer")}
                </BoutonAction>
              </li>
            );
          })}
        </ul>
      )}
      {modifiable && (
        <details className="border-t border-bordure pt-3">
          <summary className="cursor-pointer font-semibold">{t("ajouter")}</summary>
          <div className="pt-3">
            <FormulaireSource serieId={serieId} />
          </div>
        </details>
      )}
    </Carte>
  );
}
