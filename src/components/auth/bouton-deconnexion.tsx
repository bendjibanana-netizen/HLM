"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { authClient } from "@/lib/auth-client";

export function BoutonDeconnexion({ libelle, cheminAccueil }: { libelle: string; cheminAccueil: string }) {
  const [enCours, setEnCours] = useState(false);

  async function deconnecter() {
    setEnCours(true);
    await authClient.signOut();
    window.location.assign(cheminAccueil);
  }

  return (
    <Bouton variante="danger" pleineLargeur enCours={enCours} onClick={deconnecter}>
      {!enCours && <LogOut className="size-4" aria-hidden />}
      {libelle}
    </Bouton>
  );
}
