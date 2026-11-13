import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FormulaireReinitialisation } from "@/components/auth/formulaire-reinitialisation";
import { LienBouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reinitialiser-mot-de-passe">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.reinitialisation" });
  return { title: t("titre"), robots: { index: false } };
}

export default async function PageReinitialisation({
  params,
  searchParams,
}: PageProps<"/[locale]/reinitialiser-mot-de-passe">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const requete = await searchParams;
  const t = await getTranslations("Auth.reinitialisation");

  // Le lien reçu par email ajoute ?token=… ; s'il a expiré, le serveur renvoie ?error=… à la place.
  const jeton = Array.isArray(requete.token) ? requete.token[0] : requete.token;
  const lienValide = Boolean(jeton) && !requete.error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
        {lienValide && <p className="text-texte-doux">{t("sousTitre")}</p>}
      </div>
      {lienValide ? (
        <FormulaireReinitialisation jeton={jeton!} />
      ) : (
        <>
          <Message ton="erreur">{t("lienInvalide")}</Message>
          <LienBouton href="/mot-de-passe-oublie" variante="secondaire" pleineLargeur>
            {t("redemander")}
          </LienBouton>
        </>
      )}
    </div>
  );
}
