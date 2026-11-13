"use client";

import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Feuille } from "@/components/ui/feuille";

/** Démonstration du panneau modal (partie interactive de la page du design system). */
export function DemoFeuille() {
  const [ouverte, setOuverte] = useState(false);

  return (
    <>
      <Bouton variante="secondaire" onClick={() => setOuverte(true)}>
        Ouvrir le panneau
      </Bouton>
      <Feuille ouverte={ouverte} onFermer={() => setOuverte(false)} titre="Ajouter à une liste" libelleFermer="Fermer">
        <p className="mb-4 text-texte-doux">
          Sur mobile, le panneau glisse depuis le bas de l&apos;écran, à portée de pouce. Sur grand écran, il est centré.
        </p>
        <Bouton pleineLargeur onClick={() => setOuverte(false)}>
          Compris
        </Bouton>
      </Feuille>
    </>
  );
}
