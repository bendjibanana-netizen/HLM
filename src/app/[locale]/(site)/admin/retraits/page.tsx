import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { BoutonAction } from "@/components/equipe/bouton-action";
import { DecisionRetrait } from "@/components/moderation/decisions";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";
import { leverSuspension } from "@/server/actions/moderation";
import { lireReglage } from "@/server/reglages";

export const metadata: Metadata = { title: "Demandes de retrait", robots: { index: false } };

export default async function PageRetraits() {
  await exigerRole("ADMIN", "/admin");
  const t = await getTranslations("Admin");
  const format = await getFormatter();
  const [demandes, series, suspendues, seuil] = await Promise.all([
    db.demandeRetrait.findMany({ orderBy: { creeLe: "desc" }, take: 100, include: { serie: { select: { titre: true } }, equipe: { select: { nom: true } } } }),
    db.serie.findMany({ where: { statutModeration: { in: ["PUBLIEE", "EN_ATTENTE"] } }, orderBy: { titre: "asc" }, select: { id: true, titre: true } }),
    db.equipe.findMany({ where: { statut: "SUSPENDUE" }, orderBy: { suspendueLe: "desc" }, select: { id: true, nom: true, nbRetraitsJustifies: true, motifSuspension: true } }),
    lireReglage("seuilRetraits"),
  ]);
  const aTraiter = demandes.filter((d) => d.statut === "RECUE" || d.statut === "EN_EXAMEN");
  const traitees = demandes.filter((d) => d.statut === "ACCEPTEE" || d.statut === "REFUSEE");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("retraits")}</h1>
      <p className="text-sm text-texte-doux">{t("retrait.seuil", { nombre: seuil })}</p>

      <h2 className="text-xl font-bold">
        {t("retrait.aTraiter")} <span className="text-base text-texte-doux">({aTraiter.length})</span>
      </h2>
      {aTraiter.length === 0 && <p className="text-texte-doux">{t("retrait.aucune")}</p>}
      {aTraiter.map((demande) => (
        <Carte key={demande.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-bold">{demande.reference}</p>
            <time className="text-sm text-texte-doux">{format.dateTime(demande.creeLe, { dateStyle: "long", timeStyle: "short" })}</time>
          </div>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-texte-doux">{t("retrait.demandeur")}</dt>
              <dd className="font-semibold">
                {demande.nomDemandeur} ({t(`retrait.qualite.${demande.qualite as "AYANT_DROIT"}`)}){demande.organisation && ` — ${demande.organisation}`} · {demande.email}
              </dd>
            </div>
            <div>
              <dt className="text-texte-doux">{t("retrait.oeuvre")}</dt>
              <dd className="font-semibold">{demande.oeuvre}</dd>
            </div>
            <div>
              <dt className="text-texte-doux">{t("retrait.droits")}</dt>
              <dd className="whitespace-pre-line">{demande.descriptionDroits}</dd>
            </div>
            <div>
              <dt className="text-texte-doux">{t("retrait.urls")}</dt>
              <dd className="flex flex-col break-all">
                {demande.urls.map((url) => (
                  <span key={url}>{url}</span>
                ))}
              </dd>
            </div>
          </dl>
          <DecisionRetrait
            demandeId={demande.id}
            serieProposee={demande.serieId}
            series={series}
            libelles={{
              serie: t("retrait.serie"), aucuneSerie: t("retrait.aucuneSerie"), reponse: t("retrait.reponse"), accepter: t("retrait.accepter"), refuser: t("retrait.refuser"), equipeSuspendue: t("retrait.equipeSuspendue"),
              erreurs: { SERIE_REQUISE: t("retrait.erreurs.SERIE_REQUISE"), DONNEES_INVALIDES: t("retrait.erreurs.DONNEES_INVALIDES"), DEFAUT: t("retrait.erreurs.DEFAUT") },
            }}
          />
        </Carte>
      ))}

      <h2 className="mt-2 text-xl font-bold">{t("retrait.equipesSuspendues")}</h2>
      {suspendues.length === 0 && <p className="text-texte-doux">{t("retrait.aucuneSuspendue")}</p>}
      <ul className="flex flex-col gap-2">
        {suspendues.map((equipe) => (
          <li key={equipe.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bordure bg-surface p-3">
            <div>
              <p className="font-semibold">{equipe.nom}</p>
              <p className="text-sm text-texte-doux">{t("retrait.retraitsJustifies", { nombre: equipe.nbRetraitsJustifies })}</p>
            </div>
            <BoutonAction action={leverSuspension.bind(null, equipe.id)}>{t("retrait.lever")}</BoutonAction>
          </li>
        ))}
      </ul>

      <h2 className="mt-2 text-xl font-bold">{t("retrait.historique")}</h2>
      <ul className="flex flex-col gap-2">
        {traitees.map((demande) => (
          <li key={demande.id} className="flex flex-col gap-1 rounded-xl border border-bordure bg-surface p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono font-bold">{demande.reference}</span>
              <Badge ton={demande.statut === "ACCEPTEE" ? "succes" : "neutre"}>{t(`retrait.etat.${demande.statut}`)}</Badge>
            </div>
            <p>
              {demande.oeuvre} — {demande.nomDemandeur}
              {demande.serie && ` → ${demande.serie.titre}`}
              {demande.equipe && ` (${demande.equipe.nom})`}
            </p>
            {demande.reponse && <p className="text-texte-doux">{demande.reponse}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
