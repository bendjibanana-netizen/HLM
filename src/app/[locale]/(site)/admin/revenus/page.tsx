import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { BoutonAction } from "@/components/equipe/bouton-action";
import { BoutonVerser, FormulairePeriode } from "@/components/revenus/formulaires";
import { Badge } from "@/components/ui/badge";
import { classesBouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";
import { Message } from "@/components/ui/message";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";
import { cloturerPeriode, validerInfosPaiement } from "@/server/actions/revenus";
import { lireReglage } from "@/server/reglages";

export const metadata: Metadata = { title: "Revenus", robots: { index: false } };

export default async function PageRevenus() {
  await exigerRole("ADMIN", "/admin");
  const t = await getTranslations("Admin.rev");
  const tStats = await getTranslations("Stats");
  const format = await getFormatter();
  const [periodes, aVerifier, pourcentage] = await Promise.all([
    db.periodeRevenus.findMany({ orderBy: { mois: "desc" }, take: 24, include: { parts: { orderBy: { montantCentimes: "desc" }, include: { equipe: { select: { nom: true } } } } } }),
    db.infosPaiement.findMany({ where: { valideLe: null }, include: { equipe: { select: { nom: true } } } }),
    lireReglage("pourcentageReverse"),
  ]);
  const euros = (centimes: number) => format.number(centimes / 100, { style: "currency", currency: "EUR" });
  const precedent = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  const erreurs = Object.fromEntries((["MOIS_NON_TERMINE", "DEJA_CLOTUREE", "DONNEES_INVALIDES", "INFOS_MANQUANTES", "NON_CLOTUREE", "DEJA_VERSE", "DEFAUT"] as const).map((e) => [e, t(`erreurs.${e}`)]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      <Message>{t("intro")}</Message>

      <Carte className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("nouvelle")}</h2>
        <FormulairePeriode moisPropose={precedent} pourcentage={pourcentage} libelles={{ mois: t("mois"), revenu: t("revenu"), pourcentage: t("pourcentage"), calculer: t("calculer") }} erreurs={erreurs} />
      </Carte>

      <h2 className="text-xl font-bold">{t("infos")}</h2>
      {aVerifier.length === 0 && <p className="text-texte-doux">{t("aucuneInfo")}</p>}
      <ul className="flex flex-col gap-2">
        {aVerifier.map((infos) => (
          <li key={infos.equipeId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bordure bg-surface p-3 text-sm">
            <div>
              <p className="font-semibold">{infos.equipe.nom}</p>
              <p className="text-texte-doux">
                {tStats(`statuts.${infos.statutJuridique}`)} · {infos.titulaire}
                {infos.siret && ` · SIRET ${infos.siret}`}
              </p>
            </div>
            <BoutonAction action={validerInfosPaiement.bind(null, infos.equipeId)}>{t("valider")}</BoutonAction>
          </li>
        ))}
      </ul>

      <h2 className="mt-2 text-xl font-bold">{t("periodes")}</h2>
      {periodes.length === 0 && <p className="text-texte-doux">{t("aucune")}</p>}
      {periodes.map((periode) => (
        <Carte key={periode.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold capitalize">{format.dateTime(periode.mois, { month: "long", year: "numeric", timeZone: "UTC" })}</h3>
            <Badge ton={periode.statut === "CLOTUREE" ? "succes" : "alerte"}>{periode.statut === "CLOTUREE" ? t("cloturee") : t("brouillon")}</Badge>
          </div>
          <p className="text-sm text-texte-doux">{t("resume", { revenu: euros(periode.revenuTotalCentimes), pourcentage: format.number(Number(periode.pourcentageReverse)), vues: format.number(periode.totalVues) })}</p>
          {periode.parts.length === 0 ? (
            <p className="text-sm text-texte-doux">{t("aucunePart")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {periode.parts.map((part) => (
                <li key={part.id} className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{part.equipe.nom}</span>
                    <span className="flex items-center gap-2 tabular-nums">
                      <span className="text-texte-doux">{format.number(part.nbVues)} {t("vues").toLowerCase()}</span>
                      <span className="font-bold">{euros(part.montantCentimes)}</span>
                      <Badge ton={part.statut === "VERSE" ? "succes" : part.statut === "BLOQUE" ? "danger" : "alerte"}>{tStats(`etats.${part.statut}`)}</Badge>
                    </span>
                  </div>
                  {periode.statut === "CLOTUREE" && part.statut !== "VERSE" && <BoutonVerser partId={part.id} libelles={{ reference: t("reference"), verser: t("verser") }} erreurs={erreurs} />}
                  {part.referenceVersement && <p className="text-texte-doux">{part.referenceVersement}</p>}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            {periode.statut === "BROUILLON" && (
              <BoutonAction action={cloturerPeriode.bind(null, periode.id)} variante="primaire" confirmation={t("confirmerCloture")}>
                {t("cloturer")}
              </BoutonAction>
            )}
            {/* Téléchargement direct : la route vérifie le rôle admin. */}
            <a href={`/api/admin/revenus?periode=${periode.id}`} className={classesBouton({ variante: "secondaire", taille: "sm" })}>
              {t("exporter")}
            </a>
          </div>
        </Carte>
      ))}
    </div>
  );
}
