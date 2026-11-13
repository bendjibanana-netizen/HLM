import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EMPLACEMENTS } from "@/components/pub/emplacement";
import { FormulaireEmplacement } from "@/components/pub/formulaire-emplacement";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { Message } from "@/components/ui/message";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";

export const metadata: Metadata = { title: "Publicité", robots: { index: false } };

export default async function PagePublicite() {
  await exigerRole("ADMIN", "/admin");
  const t = await getTranslations("Admin.pub");
  const regles = await db.emplacementPub.findMany();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      <Message>{t("intro")}</Message>
      {Object.entries(EMPLACEMENTS).map(([cle, { nom, description }]) => {
        const regle = regles.find((r) => r.cle === cle);
        return (
          <Carte key={cle} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{nom}</h2>
              <Badge ton={regle?.actif ? "succes" : "neutre"}>{regle?.actif ? t("actif") : t("inactif")}</Badge>
            </div>
            <p className="text-sm text-texte-doux">{description}</p>
            <FormulaireEmplacement
              cle={cle}
              valeurs={{ actif: regle?.actif ?? false, code: regle?.code ?? "", mobile: regle?.mobile ?? true, bureau: regle?.bureau ?? true }}
              libelles={{ actif: t("activer"), code: t("code"), codeAide: t("codeAide"), mobile: t("mobile"), bureau: t("bureau"), enregistrer: t("enregistrer"), enregistre: t("enregistre") }}
            />
          </Carte>
        );
      })}
    </div>
  );
}
