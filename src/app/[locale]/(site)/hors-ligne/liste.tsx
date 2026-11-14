"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Bouton } from "@/components/ui/bouton";
import { chapitresTelecharges, EVENEMENT_HORS_LIGNE, supprimerChapitre } from "@/components/pwa/hors-ligne";

const abonner = (rappel: () => void) => {
  window.addEventListener(EVENEMENT_HORS_LIGNE, rappel);
  window.addEventListener("online", rappel);
  window.addEventListener("offline", rappel);
  return () => {
    window.removeEventListener(EVENEMENT_HORS_LIGNE, rappel);
    window.removeEventListener("online", rappel);
    window.removeEventListener("offline", rappel);
  };
};

/** Chapitres téléchargés sur cet appareil. La liste est lue dans le navigateur : elle fonctionne sans connexion. */
export function ListeHorsLigne() {
  const t = useTranslations("HorsLigne");
  // Les valeurs sont comparées sous forme de texte : le stockage local renvoie un nouvel objet à chaque lecture.
  const brut = useSyncExternalStore(abonner, () => JSON.stringify(chapitresTelecharges()), () => "[]");
  const horsConnexion = useSyncExternalStore(abonner, () => !navigator.onLine, () => false);
  const chapitres = JSON.parse(brut) as ReturnType<typeof chapitresTelecharges>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      {horsConnexion && (
        <p className="flex items-center gap-2 rounded-xl border border-bordure bg-surface-2 p-3 text-sm">
          <WifiOff className="size-4 shrink-0" aria-hidden />
          <span>
            <strong className="block">{t("sansConnexion")}</strong>
            {t("sansConnexionAide")}
          </span>
        </p>
      )}
      {chapitres.length === 0 ? (
        <p className="text-texte-doux">{t("vide")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {chapitres.map((chapitre) => (
            <li key={chapitre.adresse} className="flex items-center justify-between gap-3 rounded-xl border border-bordure bg-surface p-3">
              {/* Lien classique : il doit fonctionner sans connexion, servi par le service worker. */}
              <a href={chapitre.adresse} className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{chapitre.serie}</span>
                <span className="text-sm text-texte-doux">{t("chapitre", { numero: chapitre.numero })}</span>
              </a>
              <Bouton variante="discret" taille="sm" onClick={() => supprimerChapitre(chapitre.adresse)}>
                {t("supprimer")}
              </Bouton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
