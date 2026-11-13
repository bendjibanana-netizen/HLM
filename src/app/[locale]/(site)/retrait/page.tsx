import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FormulaireRetrait } from "@/components/legal/formulaire-retrait";

export async function generateMetadata({ params }: PageProps<"/[locale]/retrait">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Retrait" });
  return { title: t("titre"), description: t("intro") };
}

export default async function PageRetrait({ params }: PageProps<"/[locale]/retrait">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Retrait");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      <p className="text-texte-doux">{t("intro")}</p>
      <FormulaireRetrait />
    </div>
  );
}
