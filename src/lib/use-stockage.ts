"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENEMENT = "stockage-local";

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel); // changement depuis un autre onglet
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}

/**
 * Préférence mémorisée sur l'appareil (localStorage). Côté serveur et avant l'hydratation,
 * la valeur par défaut est utilisée : le premier affichage est identique pour tout le monde.
 */
export function useStockage<T extends string>(cle: string, defaut: T, valeursPermises: readonly T[]): [T, (valeur: T) => void] {
  const brute = useSyncExternalStore(
    abonner,
    () => {
      try {
        return localStorage.getItem(cle);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const valeur = valeursPermises.includes(brute as T) ? (brute as T) : defaut;

  const definir = useCallback(
    (nouvelle: T) => {
      try {
        localStorage.setItem(cle, nouvelle);
      } catch {
        // Stockage indisponible : la préférence ne vaudra pas au-delà de cette page.
      }
      window.dispatchEvent(new Event(EVENEMENT));
    },
    [cle],
  );

  return [valeur, definir];
}
