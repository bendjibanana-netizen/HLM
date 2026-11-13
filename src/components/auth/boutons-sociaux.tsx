"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { authClient } from "@/lib/auth-client";

type Fournisseur = "google" | "discord";

const NOMS: Record<Fournisseur, string> = { google: "Google", discord: "Discord" };

/** Boutons « Continuer avec Google / Discord ». N'affiche que les fournisseurs configurés. */
export function BoutonsSociaux({ fournisseurs, suite }: { fournisseurs: Fournisseur[]; suite: string }) {
  const t = useTranslations("Auth");
  const [enCours, setEnCours] = useState<Fournisseur | null>(null);

  if (fournisseurs.length === 0) return null;

  async function connecter(fournisseur: Fournisseur) {
    setEnCours(fournisseur);
    // Redirige vers le fournisseur ; au retour, le lecteur arrive sur `suite`.
    const { error } = await authClient.signIn.social({ provider: fournisseur, callbackURL: suite });
    if (error) setEnCours(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {fournisseurs.map((fournisseur) => (
        <Bouton
          key={fournisseur}
          variante="secondaire"
          pleineLargeur
          enCours={enCours === fournisseur}
          disabled={enCours !== null}
          onClick={() => connecter(fournisseur)}
        >
          {t("continuerAvec", { fournisseur: NOMS[fournisseur] })}
        </Bouton>
      ))}
      <div className="flex items-center gap-3 text-xs font-semibold text-texte-doux uppercase">
        <span className="h-px flex-1 bg-bordure" />
        {t("ou")}
        <span className="h-px flex-1 bg-bordure" />
      </div>
    </div>
  );
}
