import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageLegale } from "@/components/legal/page-legale";
import { CONFIDENTIALITE } from "@/content/legal";

const contenuPour = (locale: string) => CONFIDENTIALITE[locale === "en" ? "en" : "fr"];

export async function generateMetadata({ params }: PageProps<"/[locale]/confidentialite">): Promise<Metadata> {
  return { title: contenuPour((await params).locale).titre };
}

export default async function Page({ params }: PageProps<"/[locale]/confidentialite">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageLegale contenu={contenuPour(locale)} />;
}
