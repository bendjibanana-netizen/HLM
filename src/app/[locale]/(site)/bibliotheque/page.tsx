import { Bookmark } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LienBouton } from "@/components/ui/bouton";
import { EtatVide } from "@/components/ui/etat-vide";
import { exigerConnexion } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/bibliotheque">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Navigation" });
  return { title: t("bibliotheque"), robots: { index: false } };
}

// Page réservée aux comptes connectés. Son contenu (séries suivies, listes, journal) arrive en phase 4.
export default async function PageBibliotheque() {
  await exigerConnexion("/bibliotheque");
  const t = await getTranslations("Chantier");

  return (
    <EtatVide
      icone={Bookmark}
      titre={t("titre")}
      action={
        <LienBouton href="/" variante="secondaire">
          {t("retourAccueil")}
        </LienBouton>
      }
    >
      {t("bibliotheque")}
    </EtatVide>
  );
}
