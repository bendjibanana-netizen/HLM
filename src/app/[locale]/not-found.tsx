import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LienBouton } from "@/components/ui/bouton";
import { EtatVide } from "@/components/ui/etat-vide";

/** Page 404, dans la langue du visiteur. */
export default async function PageIntrouvable() {
  const t = await getTranslations("Introuvable");

  return (
    <main className="flex flex-1 items-center justify-center">
      <EtatVide icone={SearchX} titre={t("titre")} action={<LienBouton href="/">{t("retour")}</LienBouton>}>
        {t("texte")}
      </EtatVide>
    </main>
  );
}
