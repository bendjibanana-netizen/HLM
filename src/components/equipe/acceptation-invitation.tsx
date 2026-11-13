"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { accepterInvitation } from "@/server/actions/invitations";

export function AcceptationInvitation({ jeton, nouvelleEquipe, nomPropose }: { jeton: string; nouvelleEquipe: boolean; nomPropose: string | null }) {
  const t = useTranslations("Invitation");
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const nomEquipe = String(new FormData(evenement.currentTarget).get("nomEquipe") ?? "") || undefined;
    setEtat({ enCours: true });
    const resultat = await accepterInvitation({ jeton, nomEquipe }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (resultat.ok) routeur.push("/equipe");
    else setEtat({ enCours: false, erreur: resultat.erreur });
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      {etat.erreur && <Message ton="erreur">{t.has(`erreurs.${etat.erreur}`) ? t(`erreurs.${etat.erreur}`) : t("erreurs.DEFAUT")}</Message>}
      {nouvelleEquipe && <Champ libelle={t("nomEquipe")} name="nomEquipe" defaultValue={nomPropose ?? ""} aide={t("nomAide")} required minLength={2} maxLength={60} />}
      <Bouton type="submit" taille="lg" pleineLargeur enCours={etat.enCours}>
        {t("accepter")}
      </Bouton>
    </form>
  );
}
