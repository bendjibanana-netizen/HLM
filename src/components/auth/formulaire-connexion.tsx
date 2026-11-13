"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChampMotDePasse } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cleErreurAuth, type CleErreurAuth } from "./erreurs";

export function FormulaireConnexion({ suite }: { suite: string }) {
  const t = useTranslations("Auth");
  const [erreur, setErreur] = useState<CleErreurAuth | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const donnees = new FormData(evenement.currentTarget);
    setErreur(null);
    setEnCours(true);

    const { error } = await authClient.signIn.email({
      email: String(donnees.get("email")),
      password: String(donnees.get("motDePasse")),
    });

    if (error) {
      setErreur(cleErreurAuth(error));
      setEnCours(false);
      return;
    }
    // Rechargement complet : toute l'interface repart avec la nouvelle session.
    window.location.assign(suite);
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      {erreur && <Message ton="erreur">{t(`erreurs.${erreur}`, { min: 8 })}</Message>}
      <Champ libelle={t("email")} name="email" type="email" autoComplete="email" inputMode="email" required />
      <ChampMotDePasse
        libelle={t("motDePasse")}
        name="motDePasse"
        autoComplete="current-password"
        required
        libelleAfficher={t("afficherMotDePasse")}
        libelleMasquer={t("masquerMotDePasse")}
      />
      <Link href="/mot-de-passe-oublie" className="-mt-1 self-end text-sm font-semibold text-accent hover:underline">
        {t("connexion.motDePasseOublie")}
      </Link>
      <Bouton type="submit" taille="lg" pleineLargeur enCours={enCours}>
        {t("connexion.bouton")}
      </Bouton>
    </form>
  );
}
