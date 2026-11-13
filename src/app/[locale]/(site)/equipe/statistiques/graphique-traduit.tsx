"use client";

import { useTranslations } from "next-intl";
import { GraphiqueVues } from "@/components/revenus/graphique-vues";

/** Fournit au graphique ses libellés traduits (une fonction ne peut pas être transmise depuis le serveur). */
export function GraphiqueTraduit({ points }: { points: { jour: string; libelle: string; vues: number }[] }) {
  const t = useTranslations("Stats");
  return <GraphiqueVues points={points} libelleVues={(nombre) => t("vuesJour", { nombre })} libelleTableau={t("tableau")} colonnes={[t("jour"), t("vues")]} />;
}
