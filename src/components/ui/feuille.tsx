"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Panneau modal : glisse depuis le bas de l'écran sur mobile, centré sur grand écran.
 * Repose sur l'élément natif <dialog> : focus piégé, fermeture avec Échap, arrière-plan inerte.
 */
export function Feuille({
  ouverte,
  onFermer,
  titre,
  libelleFermer,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  libelleFermer: string;
  children: ReactNode;
}) {
  const reference = useRef<HTMLDialogElement>(null);

  // Synchronise l'état React avec l'ouverture réelle du <dialog>.
  useEffect(() => {
    const dialogue = reference.current;
    if (!dialogue) return;
    if (ouverte && !dialogue.open) dialogue.showModal();
    if (!ouverte && dialogue.open) dialogue.close();
  }, [ouverte]);

  return (
    <dialog
      ref={reference}
      onClose={onFermer}
      // Un clic sur l'arrière-plan (le <dialog> lui-même, hors contenu) ferme le panneau.
      onClick={(evenement) => {
        if (evenement.target === reference.current) onFermer();
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl border border-bordure bg-surface p-0 text-texte backdrop:bg-black/60 sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <div className="pb-securite flex max-h-[85dvh] flex-col">
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <h2 className="text-lg font-bold">{titre}</h2>
          <button
            type="button"
            onClick={onFermer}
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-texte-doux hover:bg-surface-2 hover:text-texte"
            aria-label={libelleFermer}
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </dialog>
  );
}
