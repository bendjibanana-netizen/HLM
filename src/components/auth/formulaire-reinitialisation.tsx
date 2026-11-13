"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { ChampMotDePasse } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cleErreurAuth, type CleErreurAuth } from "./erreurs";

const LONGUEUR_MIN_MOT_DE_PASSE = 8;

/** Choix d'un nouveau mot de passe à partir du jeton reçu par email. */
export function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const t = useTranslations("Auth");
  const routeur = useRouter();
  const [erreur, setErreur] = useState<CleErreurAuth | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const motDePasse = String(new FormData(evenement.currentTarget).get("motDePasse"));
    setErreur(null);
    setEnCours(true);

    const { error } = await authClient.resetPassword({ newPassword: motDePasse, token: jeton });

    if (error) {
      setErreur(cleErreurAuth(error));
      setEnCours(false);
      return;
    }
    // Retour à la connexion avec un message de confirmation.
    routeur.push({ pathname: "/connexion", query: { modifie: "1" } });
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      {erreur && <Message ton="erreur">{t(`erreurs.${erreur}`, { min: LONGUEUR_MIN_MOT_DE_PASSE })}</Message>}
      <ChampMotDePasse
        libelle={t("reinitialisation.nouveauMotDePasse")}
        name="motDePasse"
        autoComplete="new-password"
        required
        minLength={LONGUEUR_MIN_MOT_DE_PASSE}
        aide={t("inscription.aideMotDePasse", { min: LONGUEUR_MIN_MOT_DE_PASSE })}
        libelleAfficher={t("afficherMotDePasse")}
        libelleMasquer={t("masquerMotDePasse")}
      />
      <Bouton type="submit" taille="lg" pleineLargeur enCours={enCours}>
        {t("reinitialisation.bouton")}
      </Bouton>
    </form>
  );
}
