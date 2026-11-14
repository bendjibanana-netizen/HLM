"use client";

// Chapitres téléchargés pour la lecture hors-ligne : pages et images dans le cache du navigateur,
// liste dans le stockage local de l'appareil.
const CACHE = "chapitres-hors-ligne";
const CLE_INDEX = "hors-ligne:chapitres";
export const EVENEMENT_HORS_LIGNE = "hors-ligne-modifie";

export type ChapitreTelecharge = { adresse: string; serie: string; numero: string; images: string[]; date: string };

export function chapitresTelecharges(): ChapitreTelecharge[] {
  try {
    return JSON.parse(localStorage.getItem(CLE_INDEX) ?? "[]") as ChapitreTelecharge[];
  } catch {
    return [];
  }
}

function enregistrerIndex(chapitres: ChapitreTelecharge[]) {
  localStorage.setItem(CLE_INDEX, JSON.stringify(chapitres));
  window.dispatchEvent(new Event(EVENEMENT_HORS_LIGNE));
}

export const horsLigneDisponible = () => typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;

/** Télécharge la page du chapitre et ses images. `surProgression` reçoit le nombre d'éléments déjà enregistrés. */
export async function telechargerChapitre(chapitre: Omit<ChapitreTelecharge, "date">, surProgression: (fait: number, total: number) => void): Promise<void> {
  const cache = await caches.open(CACHE);
  const total = chapitre.images.length + 1;
  // La page est stockée telle que le lecteur la voit (connecté ou non).
  await cache.put(chapitre.adresse, await fetch(chapitre.adresse, { credentials: "include" }));
  surProgression(1, total);
  for (const [index, image] of chapitre.images.entries()) {
    // « no-cors » : les images viennent du CDN, sur un autre domaine que le site.
    await cache.put(image, await fetch(image, { mode: "no-cors" }));
    surProgression(index + 2, total);
  }
  enregistrerIndex([{ ...chapitre, date: new Date().toISOString() }, ...chapitresTelecharges().filter((c) => c.adresse !== chapitre.adresse)]);
}

export async function supprimerChapitre(adresse: string): Promise<void> {
  const chapitre = chapitresTelecharges().find((c) => c.adresse === adresse);
  const cache = await caches.open(CACHE);
  await Promise.all([cache.delete(adresse), ...(chapitre?.images ?? []).map((image) => cache.delete(image))]);
  enregistrerIndex(chapitresTelecharges().filter((c) => c.adresse !== adresse));
}
