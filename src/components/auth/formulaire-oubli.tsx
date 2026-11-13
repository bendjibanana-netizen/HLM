"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { authClient } from "@/lib/auth-client";
import { cleErreurAuth, type CleErreurAuth } from "./erreurs";

/** Demande d'un lien de réinitialisation. `cheminReinitialisation` est la page ouverte par le lien. */
export function FormulaireOubli({ cheminReinitialisation }: { cheminReinitialisation: string }) {
  const t = useTranslations("Auth");
  const [erreur, setErreur] = useState<CleErreurAuth | null>(null);
  const [envoyeA, setEnvoyeA] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const email = String(new FormData(evenement.currentTarget).get("email"));
    setErreur(null);
    setEnCours(true);

    const { error } = await authClient.requestPasswordReset({ email, redirectTo: cheminReinitialisation });

    setEnCours(false);
    if (error) {
      setErreur(cleErreurAuth(error));
      return;
    }
    // Même message que le compte existe ou non : on ne révèle pas quelles adresses sont inscrites.
    setEnvoyeA(email);
  }

  if (envoyeA) {
    return <Message ton="succes">{t("oubli.envoye", { email: envoyeA })}</Message>;
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      {erreur && <Message ton="erreur">{t(`erreurs.${erreur}`, { min: 8 })}</Message>}
      <Champ libelle={t("email")} name="email" type="email" autoComplete="email" inputMode="email" required />
      <Bouton type="submit" taille="lg" pleineLargeur enCours={enCours}>
        {t("oubli.bouton")}
      </Bouton>
    </form>
  );
}
