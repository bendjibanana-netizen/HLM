"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Link } from "@/i18n/navigation";
import { COOKIE_CONSENTEMENT, DUREE_CONSENTEMENT_JOURS, ecrireConsentement, lireConsentement, type Consentement } from "@/lib/consentement";

const EVENEMENT = "consentement-modifie";
/** Événement à émettre pour rouvrir le bandeau (lien « Cookies » du pied de page). */
export const EVENEMENT_OUVRIR_COOKIES = "ouvrir-cookies";

function cookieBrut(): string | null {
  return document.cookie.split("; ").find((ligne) => ligne.startsWith(`${COOKIE_CONSENTEMENT}=`))?.split("=")[1] ?? null;
}

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  return () => window.removeEventListener(EVENEMENT, rappel);
}

/** Choix de consentement du visiteur, à jour en temps réel. `undefined` côté serveur (choix inconnu). */
export function useConsentement(): Consentement | null | undefined {
  const brut = useSyncExternalStore<string | null | undefined>(abonner, cookieBrut, () => undefined);
  return brut === undefined ? undefined : lireConsentement(brut);
}

function enregistrer(choix: Consentement) {
  const expire = new Date(Date.now() + DUREE_CONSENTEMENT_JOURS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_CONSENTEMENT}=${ecrireConsentement(choix)}; expires=${expire}; path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(EVENEMENT));
}

/**
 * Bandeau de consentement. Refuser est aussi simple qu'accepter (même niveau, même taille),
 * et rien n'est déposé tant que le visiteur n'a pas choisi.
 */
export function BandeauCookies() {
  const t = useTranslations("Cookies");
  const consentement = useConsentement();
  const [rouvert, setRouvert] = useState(false);
  const [detail, setDetail] = useState(false);
  const [choix, setChoix] = useState<Consentement>({ mesure: false, publicite: false });

  const surOuverture = useCallback((rappel: () => void) => {
    const ouvrir = () => {
      setRouvert(true);
      setDetail(true);
      rappel();
    };
    window.addEventListener(EVENEMENT_OUVRIR_COOKIES, ouvrir);
    return () => window.removeEventListener(EVENEMENT_OUVRIR_COOKIES, ouvrir);
  }, []);
  useSyncExternalStore(surOuverture, () => rouvert, () => false);

  // Rien à afficher côté serveur, ni une fois le choix fait (sauf réouverture volontaire).
  if (consentement === undefined || (consentement !== null && !rouvert)) return null;

  const valider = (valeur: Consentement) => {
    enregistrer(valeur);
    setRouvert(false);
    setDetail(false);
  };

  return (
    <div role="dialog" aria-label={t("titre")} className="pb-nav-securite fixed inset-x-0 bottom-0 z-50 md:pb-0">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-t-2xl border border-bordure bg-surface p-4 shadow-2xl md:mb-4 md:rounded-2xl">
        <p className="font-titre text-lg font-bold">{t("titre")}</p>
        <p className="text-sm text-texte-doux">
          {t("texte")}{" "}
          <Link href="/confidentialite" className="font-semibold text-accent hover:underline">
            {t("enSavoirPlus")}
          </Link>
        </p>
        {detail && (
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-start gap-3 rounded-xl bg-surface-2 p-3 opacity-70">
              <input type="checkbox" checked disabled className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="block font-semibold">{t("necessaires")}</span>
                {t("necessairesAide")}
              </span>
            </label>
            {(["mesure", "publicite"] as const).map((cle) => (
              <label key={cle} className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-2 p-3">
                <input type="checkbox" checked={choix[cle]} onChange={(e) => setChoix({ ...choix, [cle]: e.target.checked })} className="mt-0.5 size-4 shrink-0 accent-(--accent)" />
                <span>
                  <span className="block font-semibold">{t(cle)}</span>
                  {t(`${cle}Aide`)}
                </span>
              </label>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Bouton variante="secondaire" onClick={() => valider({ mesure: false, publicite: false })}>
            {t("refuser")}
          </Bouton>
          <Bouton variante="secondaire" onClick={() => valider({ mesure: true, publicite: true })}>
            {t("accepter")}
          </Bouton>
          {detail ? (
            <Bouton className="col-span-2" onClick={() => valider(choix)}>
              {t("enregistrer")}
            </Bouton>
          ) : (
            <button type="button" onClick={() => setDetail(true)} className="col-span-2 h-9 text-sm font-semibold text-texte-doux hover:text-texte">
              {t("personnaliser")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Lien du pied de page qui rouvre le bandeau pour modifier son choix. */
export function LienCookies({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(EVENEMENT_OUVRIR_COOKIES))} className="text-left hover:text-texte hover:underline">
      {children}
    </button>
  );
}
