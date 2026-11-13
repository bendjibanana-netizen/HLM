import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { BoutonAction } from "@/components/equipe/bouton-action";
import { FormulaireInvitation } from "@/components/equipe/formulaire-invitation";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";
import { revoquerInvitation } from "@/server/actions/invitations";

export const metadata: Metadata = { title: "Invitations", robots: { index: false } };

export default async function PageInvitations() {
  await exigerRole("ADMIN", "/admin");
  const t = await getTranslations("Admin");
  const format = await getFormatter();
  const invitations = await db.invitation.findMany({ orderBy: { creeLe: "desc" }, take: 100, include: { equipe: { select: { nom: true } } } });
  const maintenant = new Date();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("invitations")}</h1>
      <Carte className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("inviterTitre")}</h2>
        <FormulaireInvitation libelles={{ email: t("email"), nomPropose: t("nomPropose"), envoyer: t("envoyer"), envoyee: t("envoyee", { email: "{email}" }) }} />
      </Carte>
      <h2 className="text-xl font-bold">{t("liste")}</h2>
      {invitations.length === 0 && <p className="text-texte-doux">{t("aucune")}</p>}
      <ul className="flex flex-col gap-2">
        {invitations.map((invitation) => {
          const etat = invitation.accepteeLe ? "ACCEPTEE" : invitation.revoqueeLe ? "REVOQUEE" : invitation.expireLe < maintenant ? "EXPIREE" : "ATTENTE";
          return (
            <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bordure bg-surface p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{invitation.email}</p>
                <p className="text-sm text-texte-doux">
                  {invitation.type === "NOUVELLE_EQUIPE" ? t("nouvelleEquipe") : t("rejoint", { equipe: invitation.equipe?.nom ?? "" })} · {format.dateTime(invitation.creeLe, { dateStyle: "medium" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge ton={etat === "ACCEPTEE" ? "succes" : etat === "ATTENTE" ? "alerte" : "neutre"}>{t(`etat.${etat}`)}</Badge>
                {etat === "ATTENTE" && (
                  <BoutonAction action={revoquerInvitation.bind(null, invitation.id)} variante="discret">
                    {t("revoquer")}
                  </BoutonAction>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
