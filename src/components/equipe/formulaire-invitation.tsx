"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { creerInvitation } from "@/server/actions/invitations";

/** Invitation par email. Avec `equipeId` : nouveau membre d'une équipe ; sans : nouvelle équipe (admin). */
export function FormulaireInvitation({ equipeId, libelles }: { equipeId?: string; libelles: { email: string; nomPropose?: string; envoyer: string; envoyee: string } }) {
  const t = useTranslations("Equipe.erreurs");
  const locale = useLocale();
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string; envoyeA?: string }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const donnees = new FormData(formulaire);
    const email = String(donnees.get("email"));
    setEtat({ enCours: true });
    const resultat = await creerInvitation({
      email,
      equipeId,
      nomEquipePropose: String(donnees.get("nomPropose") ?? "") || undefined,
      langue: (String(donnees.get("langue") ?? locale) === "en" ? "en" : "fr") as "fr" | "en",
    }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (resultat.ok) {
      formulaire.reset();
      setEtat({ enCours: false, envoyeA: email });
      routeur.refresh();
    } else {
      setEtat({ enCours: false, erreur: resultat.erreur });
    }
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      {etat.erreur && <Message ton="erreur">{t.has(etat.erreur) ? t(etat.erreur) : t("DEFAUT")}</Message>}
      {etat.envoyeA && <Message ton="succes">{libelles.envoyee.replace("{email}", etat.envoyeA)}</Message>}
      <Champ libelle={libelles.email} name="email" type="email" inputMode="email" autoComplete="off" required />
      {libelles.nomPropose && <Champ libelle={libelles.nomPropose} name="nomPropose" maxLength={60} />}
      {!equipeId && (
        <select name="langue" defaultValue="fr" aria-label="Langue" className="h-11 self-start rounded-xl border border-bordure bg-surface px-3">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      )}
      <Bouton type="submit" enCours={etat.enCours} className="self-start">
        {libelles.envoyer}
      </Bouton>
    </form>
  );
}
