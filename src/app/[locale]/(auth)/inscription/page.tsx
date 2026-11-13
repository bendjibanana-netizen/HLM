import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BoutonsSociaux } from "@/components/auth/boutons-sociaux";
import { destinationSure } from "@/components/auth/erreurs";
import { FormulaireInscription } from "@/components/auth/formulaire-inscription";
import { getPathname, Link, redirect } from "@/i18n/navigation";
import { fournisseursSociaux } from "@/lib/env";
import { obtenirSession } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/inscription">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.inscription" });
  return { title: t("titre"), robots: { index: false } };
}

export default async function PageInscription({ params, searchParams }: PageProps<"/[locale]/inscription">) {
  const { locale } = await params;
  const requete = await searchParams;
  const t = await getTranslations("Auth.inscription");

  const suiteDemandee = Array.isArray(requete.suite) ? requete.suite[0] : requete.suite;
  const suite = destinationSure(suiteDemandee, getPathname({ href: "/", locale }));

  if (await obtenirSession()) redirect({ href: "/", locale });

  const fournisseurs = (["google", "discord"] as const).filter((nom) => fournisseursSociaux[nom]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
        <p className="text-texte-doux">{t("sousTitre")}</p>
      </div>
      <BoutonsSociaux fournisseurs={fournisseurs} suite={suite} />
      <FormulaireInscription suite={suite} cheminCompte={getPathname({ href: "/compte", locale })} />
      <p className="text-center text-sm text-texte-doux">
        {t("dejaInscrit")}{" "}
        <Link
          href={{ pathname: "/connexion", query: suiteDemandee ? { suite } : undefined }}
          className="font-semibold text-accent hover:underline"
        >
          {t("seConnecter")}
        </Link>
      </p>
    </div>
  );
}
