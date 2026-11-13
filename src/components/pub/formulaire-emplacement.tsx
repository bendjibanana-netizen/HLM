"use client";

import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { reglerEmplacement } from "@/server/actions/publicite";

function Case({ nom, libelle, coche }: { nom: string; libelle: string; coche: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={nom} defaultChecked={coche} className="size-4 accent-(--accent)" />
      {libelle}
    </label>
  );
}

type Valeurs = { actif: boolean; code: string; mobile: boolean; bureau: boolean };

export function FormulaireEmplacement({ cle, valeurs, libelles }: { cle: string; valeurs: Valeurs; libelles: { actif: string; code: string; codeAide: string; mobile: string; bureau: string; enregistrer: string; enregistre: string } }) {
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; fait?: boolean; erreur?: boolean }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    setEtat({ enCours: true });
    const resultat = await reglerEmplacement({ cle, actif: f.get("actif") === "on", code: String(f.get("code") ?? ""), mobile: f.get("mobile") === "on", bureau: f.get("bureau") === "on" }).catch(() => null);
    setEtat({ enCours: false, fait: resultat?.ok, erreur: !resultat?.ok });
    if (resultat?.ok) routeur.refresh();
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Case nom="actif" libelle={libelles.actif} coche={valeurs.actif} />
        <Case nom="mobile" libelle={libelles.mobile} coche={valeurs.mobile} />
        <Case nom="bureau" libelle={libelles.bureau} coche={valeurs.bureau} />
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {libelles.code}
        <textarea name="code" defaultValue={valeurs.code} rows={4} spellCheck={false} className="w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5 font-mono text-sm font-normal" />
        <span className="font-normal text-texte-doux">{libelles.codeAide}</span>
      </label>
      {etat.fait && <Message ton="succes">{libelles.enregistre}</Message>}
      {etat.erreur && <Message ton="erreur">Erreur</Message>}
      <Bouton type="submit" variante="secondaire" taille="sm" enCours={etat.enCours} className="self-start">
        {libelles.enregistrer}
      </Bouton>
    </form>
  );
}
