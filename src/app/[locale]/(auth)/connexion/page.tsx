import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BoutonsSociaux } from "@/components/auth/boutons-sociaux";
import { destinationSure } from "@/components/auth/erreurs";
import { FormulaireConnexion } from "@/components/auth/formulaire-connexion";
import { Message } from "@/components/ui/message";
import { getPathname, Link, redirect } from "@/i18n/navigation";
import { fournisseursSociaux } from "@/lib/env";
import { obtenirSession } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/connexion">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.connexion" });
  return { title: t("titre"), robots: { index: false } };
}

function premiere(valeur: string | string[] | undefined): string | undefined {
  return Array.isArray(valeur) ? valeur[0] : valeur;
}

export default async function PageConnexion({ params, searchParams }: PageProps<"/[locale]/connexion">) {
  const { locale } = await params;
  const requete = await searchParams;
  const t = await getTranslations("Auth.connexion");

  // Destination après connexion : la page demandée au départ, sinon l'accueil.
  const suite = destinationSure(premiere(requete.suite), getPathname({ href: "/", locale }));

  // Déjà connecté : inutile d'afficher le formulaire.
  if (await obtenirSession()) redirect({ href: "/", locale });

  const fournisseurs = (["google", "discord"] as const).filter((nom) => fournisseursSociaux[nom]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
        <p className="text-texte-doux">{t("sousTitre")}</p>
      </div>
      {premiere(requete.modifie) && <Message ton="succes">{t("motDePasseModifie")}</Message>}
      <BoutonsSociaux fournisseurs={fournisseurs} suite={suite} />
      <FormulaireConnexion suite={suite} />
      <p className="text-center text-sm text-texte-doux">
        {t("pasDeCompte")}{" "}
        <Link
          href={{ pathname: "/inscription", query: requete.suite ? { suite } : undefined }}
          className="font-semibold text-accent hover:underline"
        >
          {t("creerCompte")}
        </Link>
      </p>
    </div>
  );
}
