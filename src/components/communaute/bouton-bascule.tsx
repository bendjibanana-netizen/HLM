"use client";

import { useState, type ReactNode } from "react";
import { Bouton } from "@/components/ui/bouton";
import { useRouter } from "@/i18n/navigation";

/** Bouton à deux états (suivre / abonné, public / privé…) qui appelle une action serveur puis rafraîchit la page. */
export function BoutonBascule({ actif, action, libelleActif, libelleInactif, taille = "sm" }: { actif: boolean; action: () => Promise<{ ok: boolean }>; libelleActif: ReactNode; libelleInactif: ReactNode; taille?: "sm" | "md" }) {
  const routeur = useRouter();
  const [etat, setEtat] = useState(actif);
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    setEnCours(true);
    const resultat = await action().catch(() => ({ ok: false }));
    if (resultat.ok) {
      setEtat(!etat);
      routeur.refresh();
    }
    setEnCours(false);
  }

  return (
    <Bouton variante={etat ? "secondaire" : "primaire"} taille={taille} aria-pressed={etat} enCours={enCours} onClick={basculer}>
      {etat ? libelleActif : libelleInactif}
    </Bouton>
  );
}
