import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { BoutonDeconnexion } from "@/components/auth/bouton-deconnexion";
import { RenvoiVerification } from "@/components/auth/renvoi-verification";
import { SelecteurLangue } from "@/components/mise-en-page/selecteur-langue";
import { SelecteurTheme } from "@/components/mise-en-page/selecteur-theme";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { getPathname } from "@/i18n/navigation";
import type { RoleGlobal } from "@/lib/permissions";
import { exigerConnexion } from "@/lib/session";
import { equipesDe } from "@/server/acces";
import { FormulaireProfil } from "@/components/communaute/formulaire-profil";
import { LienBouton } from "@/components/ui/bouton";
import { aAuMoinsLeRole } from "@/lib/permissions";

export async function generateMetadata({ params }: PageProps<"/[locale]/compte">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Compte" });
  return { title: t("titre"), robots: { index: false } };
}

export default async function PageCompte() {
  const { user: compte } = await exigerConnexion("/compte");
  const locale = await getLocale();
  const t = await getTranslations("Compte");
  const tAuth = await getTranslations("Auth");
  const format = await getFormatter();
  const role = compte.role as RoleGlobal;
  const tNav = await getTranslations("Navigation");
  const tCommu = await getTranslations("Communaute");
  const dansUneEquipe = (await equipesDe(compte.id)).length > 0;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>

      <Carte className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar nom={compte.name} image={compte.image} taille="lg" />
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{compte.name}</p>
            <p className="truncate text-texte-doux">@{compte.pseudo}</p>
          </div>
        </div>
        <dl className="grid gap-3 border-t border-bordure pt-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-texte-doux">{t("email")}</dt>
            <dd className="flex min-w-0 items-center gap-2 font-semibold">
              <span className="truncate">{compte.email}</span>
              <Badge ton={compte.emailVerified ? "succes" : "alerte"}>
                {compte.emailVerified ? t("emailVerifie") : t("emailNonVerifie")}
              </Badge>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-texte-doux">{t("role")}</dt>
            <dd>
              <Badge ton={role === "LECTEUR" ? "neutre" : "accent"}>{t(`roles.${role}`)}</Badge>
            </dd>
          </div>
        </dl>
        <p className="text-sm text-texte-doux">
          {t("membreDepuis", { date: format.dateTime(compte.createdAt, { dateStyle: "long" }) })}
        </p>
      </Carte>

      {(dansUneEquipe || aAuMoinsLeRole(role, "MODERATEUR")) && (
        <div className="flex flex-wrap gap-2">
          {dansUneEquipe && <LienBouton href="/equipe" variante="secondaire">{tNav("equipe")}</LienBouton>}
          {role === "ADMIN" && <LienBouton href="/admin" variante="secondaire">{tNav("admin")}</LienBouton>}
          {role === "MODERATEUR" && <LienBouton href="/moderation" variante="secondaire">Modération</LienBouton>}
        </div>
      )}

      {!compte.emailVerified && (
        <Carte className="flex flex-col gap-3">
          <p className="text-sm">{t("verificationTexte")}</p>
          <RenvoiVerification
            email={compte.email}
            cheminCompte={getPathname({ href: "/compte", locale })}
            libelle={t("renvoyerVerification")}
            confirmation={t("verificationEnvoyee")}
            echec={tAuth("erreurs.INCONNUE")}
          />
        </Carte>
      )}

      <Carte className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{tCommu("profil.modifier")}</h2>
        <FormulaireProfil nom={compte.name} bio={compte.bio ?? ""} />
        <LienBouton href={{ pathname: "/u/[pseudo]", params: { pseudo: compte.pseudo ?? "" } }} variante="discret" taille="sm" className="-ml-3.5 self-start">
          {tCommu("profil.voirProfil")}
        </LienBouton>
      </Carte>

      <Carte className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("preferences")}</h2>
        <SelecteurTheme />
        <SelecteurLangue />
      </Carte>

      <BoutonDeconnexion libelle={t("deconnexion")} cheminAccueil={getPathname({ href: "/", locale })} />
    </div>
  );
}
