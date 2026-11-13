"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { classesBouton } from "@/components/ui/bouton";
import { Feuille } from "@/components/ui/feuille";

/**
 * Enveloppe des filtres du catalogue : un bouton qui ouvre un panneau sur mobile.
 * (Sur grand écran, la page affiche directement les mêmes filtres dans une colonne.)
 */
export function PanneauFiltres({
  libelle,
  libelleFermer,
  nbActifs,
  children,
}: {
  libelle: string;
  libelleFermer: string;
  nbActifs: number;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOuvert(true)} className={classesBouton({ variante: "secondaire", taille: "sm" })}>
        <SlidersHorizontal className="size-4" aria-hidden />
        {libelle}
        {nbActifs > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-accent text-xs text-sur-accent">{nbActifs}</span>
        )}
      </button>
      <Feuille ouverte={ouvert} onFermer={() => setOuvert(false)} titre={libelle} libelleFermer={libelleFermer}>
        {children}
      </Feuille>
    </div>
  );
}
