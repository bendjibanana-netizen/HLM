"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { abonnerPush, desabonnerPush, reglerNotifications } from "@/server/actions/notifications";

type Preferences = { chapitreSite: boolean; chapitrePush: boolean; chapitreEmail: boolean };

/** Convertit la clé publique VAPID (base64url) au format attendu par le navigateur. */
function cleVersOctets(cle: string): Uint8Array<ArrayBuffer> {
  const base64 = (cle + "=".repeat((4 - (cle.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(base64);
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i);
  return octets;
}

const sansAbonnement = () => () => {};

/** Préférences de notification et activation du push sur l'appareil courant. */
export function ReglagesNotifications({ initiales, cleVapid }: { initiales: Preferences; cleVapid: string | null }) {
  const t = useTranslations("Notifications");
  const [etat, setEtat] = useState<{ enCours: boolean; fait?: boolean }>({ enCours: false });
  const [push, setPush] = useState<"inconnu" | "actif" | "refuse" | "erreur">("inconnu");
  const disponible = useSyncExternalStore(sansAbonnement, () => Boolean(cleVapid) && "serviceWorker" in navigator && "PushManager" in window, () => false);

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    setEtat({ enCours: true });
    const resultat = await reglerNotifications({ chapitreSite: f.get("site") === "on", chapitrePush: f.get("push") === "on", chapitreEmail: f.get("email") === "on" }).catch(() => null);
    setEtat({ enCours: false, fait: resultat?.ok });
  }

  async function activer() {
    if ((await Notification.requestPermission()) !== "granted") return setPush("refuse");
    try {
      const enregistrement = await navigator.serviceWorker.ready;
      const abonnement = (await enregistrement.pushManager.getSubscription()) ?? (await enregistrement.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleVersOctets(cleVapid!) }));
      const { endpoint, keys } = abonnement.toJSON();
      const resultat = await abonnerPush({ endpoint: endpoint!, p256dh: keys!.p256dh!, auth: keys!.auth! }, navigator.userAgent);
      setPush(resultat.ok ? "actif" : "erreur");
    } catch {
      setPush("erreur");
    }
  }

  async function desactiver() {
    const abonnement = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (abonnement) {
      await desabonnerPush(abonnement.endpoint);
      await abonnement.unsubscribe();
    }
    setPush("inconnu");
  }

  const cases: [string, string, boolean][] = [["site", t("site"), initiales.chapitreSite], ["push", t("push"), initiales.chapitrePush], ["email", t("email"), initiales.chapitreEmail]];

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={soumettre} className="flex flex-col gap-3">
        <p className="text-sm text-texte-doux">{t("prefIntro")}</p>
        {cases.map(([nom, libelle, coche]) => (
          <label key={nom} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-bordure px-3 has-checked:border-accent has-checked:bg-accent/10">
            <input type="checkbox" name={nom} defaultChecked={coche} className="size-4 shrink-0 accent-(--accent)" />
            {libelle}
          </label>
        ))}
        {etat.fait && <Message ton="succes">{t("enregistre")}</Message>}
        <Bouton type="submit" variante="secondaire" taille="sm" enCours={etat.enCours} className="self-start">
          {t("enregistrer")}
        </Bouton>
      </form>
      <div className="flex flex-col gap-2 border-t border-bordure pt-4">
        {!disponible ? (
          <p className="text-sm text-texte-doux">{t("pushIndisponible")}</p>
        ) : push === "actif" ? (
          <>
            <Message ton="succes">{t("pushActif")}</Message>
            <Bouton variante="discret" taille="sm" onClick={desactiver} className="self-start">
              {t("desactiverPush")}
            </Bouton>
          </>
        ) : (
          <>
            {push === "refuse" && <Message ton="erreur">{t("pushRefuse")}</Message>}
            {push === "erreur" && <Message ton="erreur">{t("pushIndisponible")}</Message>}
            <Bouton variante="secondaire" taille="sm" onClick={activer} className="self-start">
              {t("activerPush")}
            </Bouton>
          </>
        )}
      </div>
    </div>
  );
}
