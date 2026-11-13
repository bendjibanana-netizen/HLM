"use client";

import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { authClient } from "@/lib/auth-client";

/** Renvoie l'email de vérification au compte connecté. */
export function RenvoiVerification({
  email,
  cheminCompte,
  libelle,
  confirmation,
  echec,
}: {
  email: string;
  cheminCompte: string;
  libelle: string;
  confirmation: string;
  echec: string;
}) {
  const [etat, setEtat] = useState<"repos" | "envoi" | "envoye" | "echec">("repos");

  async function renvoyer() {
    setEtat("envoi");
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: cheminCompte });
    setEtat(error ? "echec" : "envoye");
  }

  if (etat === "envoye") return <Message ton="succes">{confirmation}</Message>;

  return (
    <div className="flex flex-col gap-3">
      {etat === "echec" && <Message ton="erreur">{echec}</Message>}
      <Bouton variante="secondaire" taille="sm" enCours={etat === "envoi"} onClick={renvoyer} className="self-start">
        {libelle}
      </Bouton>
    </div>
  );
}
