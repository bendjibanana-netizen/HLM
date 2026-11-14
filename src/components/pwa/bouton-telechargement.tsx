"use client";

import { CircleCheck, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { Bouton } from "@/components/ui/bouton";
import { chapitresTelecharges, EVENEMENT_HORS_LIGNE, horsLigneDisponible, supprimerChapitre, telechargerChapitre } from "./hors-ligne";

const abonner = (rappel: () => void) => {
  window.addEventListener(EVENEMENT_HORS_LIGNE, rappel);
  return () => window.removeEventListener(EVENEMENT_HORS_LIGNE, rappel);
};

/** Bouton du lecteur : télécharge le chapitre affiché pour le lire sans connexion. */
export function BoutonTelechargement({ serie, numero, images }: { serie: string; numero: string; images: string[] }) {
  const t = useTranslations("HorsLigne");
  const [progression, setProgression] = useState<{ fait: number; total: number } | null>(null);
  const [echec, setEchec] = useState(false);
  const disponible = useSyncExternalStore(() => () => {}, horsLigneDisponible, () => false);
  const dejaLa = useSyncExternalStore(abonner, () => chapitresTelecharges().some((c) => c.adresse === location.pathname), () => false);

  if (!disponible) return null;

  async function telecharger() {
    setEchec(false);
    setProgression({ fait: 0, total: images.length + 1 });
    try {
      await telechargerChapitre({ adresse: location.pathname, serie, numero, images }, (fait, total) => setProgression({ fait, total }));
    } catch {
      setEchec(true);
    }
    setProgression(null);
  }

  if (dejaLa) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-succes">
          <CircleCheck className="size-4" aria-hidden />
          {t("telecharge")}
        </span>
        <Bouton variante="discret" taille="sm" onClick={() => supprimerChapitre(location.pathname)}>
          {t("supprimer")}
        </Bouton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Bouton variante="secondaire" pleineLargeur enCours={progression !== null} onClick={telecharger}>
        {progression === null && <Download className="size-4" aria-hidden />}
        {progression ? t("telechargement", { courant: progression.fait, total: progression.total }) : t("telecharger")}
      </Bouton>
      {echec && <p className="text-sm text-danger">{t("echec")}</p>}
    </div>
  );
}
