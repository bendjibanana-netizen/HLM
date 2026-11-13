import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Pub } from "./pub";

/** Emplacements publicitaires du site. Jamais au milieu des planches : en fin de chapitre ou en bas de page. */
export const EMPLACEMENTS = {
  "lecteur-fin-chapitre": { nom: "Lecteur — fin de chapitre", description: "Entre deux chapitres, après la dernière planche." },
  "serie-bas-de-page": { nom: "Fiche série — bas de page", description: "Sous la liste des chapitres et les critiques." },
  "accueil-milieu": { nom: "Accueil — entre deux sections", description: "Entre les sorties de la semaine et les tendances." },
  "catalogue-bas": { nom: "Catalogue — bas de page", description: "Sous les résultats." },
} as const;

export type CleEmplacement = keyof typeof EMPLACEMENTS;

/** Données d'un emplacement actif, ou null. Utilisable pour passer la publicité à un composant client. */
export async function emplacementActif(cle: CleEmplacement) {
  return db.emplacementPub.findFirst({ where: { cle, actif: true }, select: { code: true, mobile: true, bureau: true } });
}

/** Affiche l'emplacement s'il est activé par l'admin (et si le visiteur a consenti). */
export async function EmplacementPub({ cle }: { cle: CleEmplacement }) {
  const emplacement = await emplacementActif(cle);
  if (!emplacement) return null;
  const t = await getTranslations("Pub");
  return <Pub code={emplacement.code} libelle={t("libelle")} mobile={emplacement.mobile} bureau={emplacement.bureau} />;
}
