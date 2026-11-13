"use client";

import { useEffect, useRef } from "react";
import { useConsentement } from "@/components/legal/bandeau-cookies";

/**
 * Affiche une publicité, uniquement si le visiteur a accepté les cookies publicitaires.
 * Le code de la régie (saisi par l'admin) est inséré tel quel, scripts compris.
 */
export function Pub({ code, libelle, mobile, bureau }: { code: string | null; libelle: string; mobile: boolean; bureau: boolean }) {
  const consentement = useConsentement();
  const conteneur = useRef<HTMLDivElement>(null);
  const autorise = Boolean(consentement?.publicite);

  useEffect(() => {
    const element = conteneur.current;
    if (!autorise || !code || !element) return;
    // createContextualFragment exécute les balises <script> du code, ce que innerHTML ne fait pas.
    element.replaceChildren(document.createRange().createContextualFragment(code));
    return () => element.replaceChildren();
  }, [autorise, code]);

  if (!autorise) return null;
  const visibilite = mobile && bureau ? "" : mobile ? "md:hidden" : "hidden md:block";

  return (
    <aside aria-label={libelle} className={`mx-auto w-full max-w-3xl px-4 py-4 ${visibilite}`}>
      <p className="mb-1 text-center text-[0.6875rem] tracking-wide text-texte-doux uppercase">{libelle}</p>
      {code ? (
        // Hauteur minimale réservée : la page ne saute pas quand la publicité arrive.
        <div ref={conteneur} className="flex min-h-24 items-center justify-center overflow-hidden" />
      ) : (
        <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-bordure text-sm text-texte-doux">{libelle}</div>
      )}
    </aside>
  );
}
