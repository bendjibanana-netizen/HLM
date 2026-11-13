import { MailX } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AcceptationInvitation } from "@/components/equipe/acceptation-invitation";
import { LienBouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";
import { EtatVide } from "@/components/ui/etat-vide";
import { Message } from "@/components/ui/message";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { obtenirSession } from "@/lib/session";
import { invitationValide } from "@/server/actions/invitations";

export const metadata: Metadata = { title: "Invitation", robots: { index: false } };

export default async function PageInvitation({ params }: PageProps<"/[locale]/invitation/[jeton]">) {
  const { locale, jeton } = await params;
  const t = await getTranslations("Invitation");
  const tAuth = await getTranslations("Navigation");
  const invitation = await invitationValide(jeton);

  if (!invitation) {
    return (
      <EtatVide icone={MailX} titre={t("invalide")}>
        {t("invalideAide")}
      </EtatVide>
    );
  }

  const session = await obtenirSession();
  const suite = getPathname({ href: { pathname: "/invitation/[jeton]", params: { jeton } }, locale: locale as Locale });
  const bonCompte = session?.user.email.toLowerCase() === invitation.email;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      <Carte className="flex flex-col gap-4">
        <p>{invitation.type === "NOUVELLE_EQUIPE" ? t("nouvelle") : t("rejoindre", { equipe: invitation.equipe?.nom ?? "" })}</p>
        {!session ? (
          <>
            <Message>{t("connexionRequise", { email: invitation.email })}</Message>
            <LienBouton href={{ pathname: "/inscription", query: { suite } }} pleineLargeur>
              {tAuth("inscription")}
            </LienBouton>
            <LienBouton href={{ pathname: "/connexion", query: { suite } }} variante="secondaire" pleineLargeur>
              {tAuth("connexion")}
            </LienBouton>
          </>
        ) : !bonCompte ? (
          <Message ton="erreur">{t("emailDifferent", { email: invitation.email })}</Message>
        ) : (
          <AcceptationInvitation jeton={jeton} nouvelleEquipe={invitation.type === "NOUVELLE_EQUIPE"} nomPropose={invitation.nomEquipePropose} />
        )}
      </Carte>
    </div>
  );
}
