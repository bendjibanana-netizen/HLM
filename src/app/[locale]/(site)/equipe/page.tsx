import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { BoutonAction } from "@/components/equipe/bouton-action";
import { FormulaireInvitation } from "@/components/equipe/formulaire-invitation";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Badge } from "@/components/ui/badge";
import { LienBouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";
import { Message } from "@/components/ui/message";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { exigerConnexion } from "@/lib/session";
import { equipesDe } from "@/server/acces";
import { revoquerInvitation } from "@/server/actions/invitations";

export const metadata: Metadata = { title: "Espace équipe", robots: { index: false } };

const TON = { BROUILLON: "neutre", EN_ATTENTE: "alerte", PUBLIEE: "succes", REFUSEE: "danger", RETIREE: "danger" } as const;

export default async function PageEquipe() {
  const session = await exigerConnexion("/equipe");
  const appartenances = await equipesDe(session.user.id);
  // L'espace équipe n'existe que pour les comptes invités : les autres reçoivent une page 404.
  if (appartenances.length === 0) notFound();

  const t = await getTranslations("Equipe");
  const tSerie = await getTranslations("Serie");
  const tStats = await getTranslations("Stats");
  const format = await getFormatter();
  const equipes = await db.equipe.findMany({
    where: { id: { in: appartenances.map(({ equipe }) => equipe.id) } },
    orderBy: { creeLe: "asc" },
    include: {
      series: { orderBy: { majLe: "desc" }, select: { id: true, titre: true, statutModeration: true, couvertureCle: true, couleurDominante: true, nbChapitres: true } },
      membres: { orderBy: { rejointLe: "asc" }, select: { role: true, user: { select: { name: true, pseudo: true } } } },
      invitations: { where: { accepteeLe: null, revoqueeLe: null, expireLe: { gt: new Date() } }, select: { id: true, email: true, expireLe: true } },
    },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      {equipes.map((equipe) => {
        const chef = appartenances.find((a) => a.equipe.id === equipe.id)?.role === "CHEF";
        return (
          <section key={equipe.id} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{equipe.nom}</h2>
            {equipe.statut === "SUSPENDUE" && <Message ton="erreur">{t("suspendue")}</Message>}
            <div className="flex flex-wrap gap-2">
              <LienBouton href={{ pathname: "/equipe/statistiques", query: { equipe: equipe.id } }} variante="secondaire" taille="sm">
                {tStats("statistiques")}
              </LienBouton>
              <LienBouton href={{ pathname: "/equipe/revenus", query: { equipe: equipe.id } }} variante="secondaire" taille="sm">
                {tStats("revenus")}
              </LienBouton>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{t("series")}</h3>
              {equipe.statut === "ACTIVE" && (
                <LienBouton href={{ pathname: "/equipe/series/nouvelle", query: { equipe: equipe.id } }} taille="sm">
                  <Plus className="size-4" aria-hidden />
                  {t("nouvelleSerie")}
                </LienBouton>
              )}
            </div>
            {equipe.series.length === 0 ? (
              <p className="text-texte-doux">{t("aucuneSerie")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {equipe.series.map((serie) => (
                  <li key={serie.id}>
                    <Link href={{ pathname: "/equipe/series/[id]", params: { id: serie.id } }} className="flex items-center gap-3 rounded-xl border border-bordure bg-surface p-2 hover:bg-surface-2">
                      <span className="w-11 shrink-0">
                        <ImageCouverture cle={serie.couvertureCle} couleur={serie.couleurDominante} alt="" sizes="44px" className="rounded-md" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{serie.titre}</span>
                        <span className="text-sm text-texte-doux">{tSerie("chapitres", { nombre: serie.nbChapitres })}</span>
                      </span>
                      <Badge ton={TON[serie.statutModeration]}>{t(`moderation.${serie.statutModeration}`)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Carte className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">{t("membres")}</h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                {equipe.membres.map(({ role, user }) => (
                  <li key={user.pseudo} className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">
                      {user.name} <span className="font-normal text-texte-doux">@{user.pseudo}</span>
                    </span>
                    <Badge ton={role === "CHEF" ? "accent" : "neutre"}>{role === "CHEF" ? t("chef") : t("membre")}</Badge>
                  </li>
                ))}
              </ul>
              {chef && equipe.statut === "ACTIVE" && (
                <div className="flex flex-col gap-3 border-t border-bordure pt-3">
                  <h4 className="font-bold">{t("inviter")}</h4>
                  <p className="text-sm text-texte-doux">{t("inviterAide")}</p>
                  <FormulaireInvitation equipeId={equipe.id} libelles={{ email: t("emailInvite"), envoyer: t("envoyerInvitation"), envoyee: t("invitationEnvoyee", { email: "{email}" }) }} />
                  {equipe.invitations.length > 0 && (
                    <ul className="flex flex-col gap-2 text-sm" aria-label={t("invitationsEnAttente")}>
                      {equipe.invitations.map((invitation) => (
                        <li key={invitation.id} className="flex items-center justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{invitation.email}</span>
                            <span className="text-texte-doux">{t("expire", { date: format.dateTime(invitation.expireLe, { dateStyle: "medium" }) })}</span>
                          </span>
                          <BoutonAction action={revoquerInvitation.bind(null, invitation.id)} variante="discret">
                            {t("revoquer")}
                          </BoutonAction>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Carte>
          </section>
        );
      })}
    </div>
  );
}
