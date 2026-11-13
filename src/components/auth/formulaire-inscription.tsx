"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChampMotDePasse } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { authClient } from "@/lib/auth-client";
import {
  normaliserPseudo,
  PSEUDO_LONGUEUR_MAX,
  PSEUDO_LONGUEUR_MIN,
  validerPseudo,
  type ErreurPseudo,
} from "@/lib/pseudo";
import { cleErreurAuth, type CleErreurAuth } from "./erreurs";

const LONGUEUR_MIN_MOT_DE_PASSE = 8;

export function FormulaireInscription({ suite, cheminCompte }: { suite: string; cheminCompte: string }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [erreur, setErreur] = useState<CleErreurAuth | null>(null);
  const [erreurPseudo, setErreurPseudo] = useState<ErreurPseudo | null>(null);
  const [enCours, setEnCours] = useState(false);

  const bornes = { min: PSEUDO_LONGUEUR_MIN, max: PSEUDO_LONGUEUR_MAX };

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const donnees = new FormData(evenement.currentTarget);
    const pseudoSaisi = String(donnees.get("pseudo")).trim();
    const pseudo = normaliserPseudo(pseudoSaisi);

    setErreur(null);
    const probleme = validerPseudo(pseudo);
    setErreurPseudo(probleme);
    if (probleme) return;

    setEnCours(true);
    const { error } = await authClient.signUp.email({
      // Le nom affiché garde la casse saisie ; le pseudo (identifiant) est en minuscules.
      name: pseudoSaisi,
      pseudo,
      email: String(donnees.get("email")),
      password: String(donnees.get("motDePasse")),
      langue: locale === "en" ? "EN" : "FR",
      // Destination du lien de vérification envoyé par email.
      callbackURL: cheminCompte,
    });

    if (error) {
      setErreur(cleErreurAuth(error));
      setEnCours(false);
      return;
    }
    window.location.assign(suite);
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4" noValidate={false}>
      {erreur && <Message ton="erreur">{t(`erreurs.${erreur}`, { min: LONGUEUR_MIN_MOT_DE_PASSE })}</Message>}
      <Champ
        libelle={t("pseudo")}
        name="pseudo"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        minLength={PSEUDO_LONGUEUR_MIN}
        maxLength={PSEUDO_LONGUEUR_MAX}
        aide={t("inscription.aidePseudo", bornes)}
        erreur={erreurPseudo ? t(`pseudoErreurs.${erreurPseudo}`, bornes) : undefined}
      />
      <Champ libelle={t("email")} name="email" type="email" autoComplete="email" inputMode="email" required />
      <ChampMotDePasse
        libelle={t("motDePasse")}
        name="motDePasse"
        autoComplete="new-password"
        required
        minLength={LONGUEUR_MIN_MOT_DE_PASSE}
        aide={t("inscription.aideMotDePasse", { min: LONGUEUR_MIN_MOT_DE_PASSE })}
        libelleAfficher={t("afficherMotDePasse")}
        libelleMasquer={t("masquerMotDePasse")}
      />
      <Bouton type="submit" taille="lg" pleineLargeur enCours={enCours}>
        {t("inscription.bouton")}
      </Bouton>
    </form>
  );
}
