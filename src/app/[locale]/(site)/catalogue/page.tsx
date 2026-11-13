import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LienBouton } from "@/components/ui/bouton";
import { EtatVide } from "@/components/ui/etat-vide";

export async function generateMetadata({ params }: PageProps<"/[locale]/catalogue">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Navigation" });
  return { title: t("catalogue") };
}

// Page d'attente : le catalogue et la recherche (Meilisearch) sont construits en phase 2.
export default async function PageCatalogue({ params, searchParams }: PageProps<"/[locale]/catalogue">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Chantier");

  const { q } = await searchParams;
  const requete = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100);

  return (
    <EtatVide
      icone={Compass}
      titre={t("titre")}
      action={
        <LienBouton href="/" variante="secondaire">
          {t("retourAccueil")}
        </LienBouton>
      }
    >
      {requete ? t("rechercheEnAttente", { requete }) : t("catalogue")}
    </EtatVide>
  );
}
