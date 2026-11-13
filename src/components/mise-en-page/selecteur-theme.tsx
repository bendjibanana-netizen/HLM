"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Segments } from "@/components/ui/segments";

type Theme = "systeme" | "clair" | "sombre";

const CLE_STOCKAGE = "theme";
const EVENEMENT = "changement-theme";

function lireTheme(): Theme {
  try {
    const enregistre = localStorage.getItem(CLE_STOCKAGE);
    return enregistre === "clair" || enregistre === "sombre" ? enregistre : "systeme";
  } catch {
    // Stockage indisponible (navigation privée stricte) : on suit le système.
    return "systeme";
  }
}

function appliquerTheme(theme: Theme) {
  try {
    if (theme === "systeme") localStorage.removeItem(CLE_STOCKAGE);
    else localStorage.setItem(CLE_STOCKAGE, theme);
  } catch {
    // Le choix vaudra pour cette page seulement.
  }
  if (theme === "systeme") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(EVENEMENT));
}

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel); // changement depuis un autre onglet
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}

/** Choix du thème : suivre le système, clair ou sombre. Le choix est mémorisé sur l'appareil. */
export function SelecteurTheme() {
  const t = useTranslations("Theme");
  // Côté serveur, le choix est inconnu : aucun segment n'est sélectionné avant l'hydratation.
  const theme = useSyncExternalStore<Theme | null>(abonner, lireTheme, () => null);

  return (
    <Segments
      libelle={t("libelle")}
      valeur={theme}
      onChange={appliquerTheme}
      options={[
        { valeur: "systeme", libelle: t("systeme") },
        { valeur: "clair", libelle: t("clair") },
        { valeur: "sombre", libelle: t("sombre") },
      ]}
    />
  );
}
