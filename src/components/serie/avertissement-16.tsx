"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore, type ReactNode } from "react";
import { Bouton, LienBouton } from "@/components/ui/bouton";

const CLE = "avertissement-16";
const EVENEMENT = "avertissement-16-accepte";

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  return () => window.removeEventListener(EVENEMENT, rappel);
}

function dejaAccepte(): boolean {
  try {
    return localStorage.getItem(CLE) === "ok";
  } catch {
    return false;
  }
}

/**
 * Avertissement affiché avant le contenu d'une série classée 16+.
 * Le contenu n'est rendu qu'après confirmation ; le choix est mémorisé sur l'appareil.
 */
export function Avertissement16({ children }: { children: ReactNode }) {
  const t = useTranslations("Avertissement");
  // Côté serveur, le choix est inconnu : l'avertissement est affiché par défaut.
  const accepte = useSyncExternalStore(abonner, dejaAccepte, () => false);

  if (accepte) return <>{children}</>;

  function accepter() {
    try {
      localStorage.setItem(CLE, "ok");
    } catch {
      // Stockage indisponible : l'avertissement réapparaîtra à la prochaine page.
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-danger/12 text-danger">
        <ShieldAlert className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-extrabold">{t("titre")}</h1>
      <p className="text-texte-doux">{t("texte")}</p>
      <Bouton pleineLargeur taille="lg" onClick={accepter}>
        {t("continuer")}
      </Bouton>
      <LienBouton href="/" variante="discret" pleineLargeur>
        {t("retour")}
      </LienBouton>
    </div>
  );
}
