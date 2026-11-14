import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ListeHorsLigne } from "./liste";

export const metadata: Metadata = { title: "Hors-ligne", robots: { index: false } };

// Page statique : mise en cache par le service worker, elle s'affiche sans connexion.
export default async function PageHorsLigne({ params }: PageProps<"/[locale]/hors-ligne">) {
  setRequestLocale((await params).locale);
  return <ListeHorsLigne />;
}
