import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FormulaireOubli } from "@/components/auth/formulaire-oubli";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/mot-de-passe-oublie">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.oubli" });
  return { title: t("titre"), robots: { index: false } };
}

export default async function PageMotDePasseOublie({ params }: PageProps<"/[locale]/mot-de-passe-oublie">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth.oubli");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
        <p className="text-texte-doux">{t("sousTitre")}</p>
      </div>
      <FormulaireOubli
        cheminReinitialisation={getPathname({ href: "/reinitialiser-mot-de-passe", locale: locale as Locale })}
      />
      <Link href="/connexion" className="self-center text-sm font-semibold text-accent hover:underline">
        {t("retourConnexion")}
      </Link>
    </div>
  );
}
