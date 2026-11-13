import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageLegale } from "@/components/legal/page-legale";
import { MENTIONS } from "@/content/legal";

const contenuPour = (locale: string) => MENTIONS[locale === "en" ? "en" : "fr"];

export async function generateMetadata({ params }: PageProps<"/[locale]/mentions-legales">): Promise<Metadata> {
  return { title: contenuPour((await params).locale).titre };
}

export default async function Page({ params }: PageProps<"/[locale]/mentions-legales">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageLegale contenu={contenuPour(locale)} />;
}
