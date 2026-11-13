"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { modifierProfil } from "@/server/actions/communaute";

export function FormulaireProfil({ nom, bio }: { nom: string; bio: string }) {
  const t = useTranslations("Communaute");
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; fait?: boolean; erreur?: boolean }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    setEtat({ enCours: true });
    const resultat = await modifierProfil({ nom: String(f.get("nom")), bio: String(f.get("bio")) }).catch(() => null);
    setEtat({ enCours: false, fait: resultat?.ok, erreur: !resultat?.ok });
    if (resultat?.ok) routeur.refresh();
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      {etat.fait && <Message ton="succes">{t("profil.enregistre")}</Message>}
      {etat.erreur && <Message ton="erreur">{t("erreurs.DEFAUT")}</Message>}
      <Champ libelle={t("profil.nom")} name="nom" defaultValue={nom} required minLength={2} maxLength={40} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("profil.bio")}
        <textarea name="bio" defaultValue={bio} rows={3} maxLength={300} className="w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5 font-normal" />
        <span className="font-normal text-texte-doux">{t("profil.bioAide")}</span>
      </label>
      <Bouton type="submit" enCours={etat.enCours} className="self-start">
        {t("profil.enregistrer")}
      </Bouton>
    </form>
  );
}
