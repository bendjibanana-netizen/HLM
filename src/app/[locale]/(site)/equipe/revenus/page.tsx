import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { FormulairePaiement } from "@/components/revenus/formulaires";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { Message } from "@/components/ui/message";
import { db } from "@/lib/db";
import { exigerConnexion } from "@/lib/session";
import { membreDe } from "@/server/acces";

export const metadata: Metadata = { title: "Revenus", robots: { index: false } };

export default async function PageRevenusEquipe({ searchParams }: PageProps<"/[locale]/equipe/revenus">) {
  await exigerConnexion("/equipe");
  const { equipe: equipeId } = await searchParams;
  const acces = typeof equipeId === "string" ? await membreDe(equipeId) : null;
  if (!acces) notFound();

  const t = await getTranslations("Stats");
  const format = await getFormatter();
  const maintenant = new Date();
  const debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
  const [vuesMois, parts, infos, derniere] = await Promise.all([
    db.vueJournaliere.aggregate({ where: { equipeId: acces.equipe.id, date: { gte: debutMois } }, _sum: { nbVues: true } }),
    db.partRevenus.findMany({ where: { equipeId: acces.equipe.id }, orderBy: { periode: { mois: "desc" } }, include: { periode: { select: { mois: true, statut: true } } } }),
    db.infosPaiement.findUnique({ where: { equipeId: acces.equipe.id } }),
    db.periodeRevenus.findFirst({ where: { totalVues: { gt: 0 } }, orderBy: { mois: "desc" }, select: { revenuTotalCentimes: true, pourcentageReverse: true, totalVues: true } }),
  ]);
  const vues = vuesMois._sum.nbVues ?? 0;
  // Estimation : vues du mois × revenu reversé par vue lors de la dernière répartition.
  const estimation = derniere ? Math.round((vues * derniere.revenuTotalCentimes * Number(derniere.pourcentageReverse)) / 100 / derniere.totalVues) : null;
  const euros = (centimes: number) => format.number(centimes / 100, { style: "currency", currency: "EUR" });
  const cles = ["statutJuridique", "raisonSociale", "siret", "titulaire", "iban", "ibanAide", "ibanEnregistre", "bic", "adresse", "enregistrer", "enregistre"] as const;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <div>
        <p className="text-sm font-semibold text-texte-doux">{acces.equipe.nom}</p>
        <h1 className="text-3xl font-extrabold">{t("revenus")}</h1>
      </div>

      <Carte className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{t("estimation")}</h2>
        {estimation !== null ? (
          <>
            <p className="font-titre text-4xl font-extrabold tabular-nums">≈ {euros(estimation)}</p>
            <p className="text-sm text-texte-doux">{t("estimationTexte", { vues })}</p>
          </>
        ) : (
          <p className="text-texte-doux">{t("estimationIndisponible", { vues })}</p>
        )}
      </Carte>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{t("historique")}</h2>
        {parts.length === 0 ? (
          <p className="text-texte-doux">{t("aucunHistorique")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {parts.map((part) => (
              <li key={part.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bordure bg-surface p-3">
                <div>
                  <p className="font-semibold capitalize">
                    {format.dateTime(part.periode.mois, { month: "long", year: "numeric", timeZone: "UTC" })}
                    {part.periode.statut === "BROUILLON" && <span className="ml-2 text-sm font-normal text-texte-doux normal-case">({t("brouillon")})</span>}
                  </p>
                  <p className="text-sm text-texte-doux">{t("vuesJour", { nombre: part.nbVues })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums">{euros(part.montantCentimes)}</span>
                  <Badge ton={part.statut === "VERSE" ? "succes" : part.statut === "BLOQUE" ? "danger" : "alerte"}>{t(`etats.${part.statut}`)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Carte className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("paiement")}</h2>
        <p className="text-sm text-texte-doux">{t("paiementAide")}</p>
        <Message ton={infos?.valideLe ? "succes" : infos ? "info" : "erreur"}>{infos?.valideLe ? t("paiementValide") : infos ? t("paiementAttente") : t("paiementAbsent")}</Message>
        {acces.chef ? (
          <FormulairePaiement
            equipeId={acces.equipe.id}
            infos={{ statutJuridique: infos?.statutJuridique ?? "AUTO_ENTREPRENEUR", raisonSociale: infos?.raisonSociale ?? "", siret: infos?.siret ?? "", titulaire: infos?.titulaire ?? "", bic: infos?.bic ?? "", adresse: infos?.adresse ?? "", ibanEnregistre: Boolean(infos) }}
            libelles={Object.fromEntries(cles.map((cle) => [cle, t(cle)]))}
            statuts={Object.fromEntries((["PARTICULIER", "AUTO_ENTREPRENEUR", "SOCIETE", "ASSOCIATION", "AUTRE"] as const).map((s) => [s, t(`statuts.${s}`)]))}
            erreurs={Object.fromEntries((["IBAN_INVALIDE", "SIRET_REQUIS", "DONNEES_INVALIDES", "INTERDIT", "DEFAUT"] as const).map((e) => [e, t(`erreursPaiement.${e}`)]))}
          />
        ) : (
          <p className="text-sm text-texte-doux">{t("reserveChef")}</p>
        )}
      </Carte>
    </div>
  );
}
