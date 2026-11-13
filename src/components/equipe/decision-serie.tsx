"use client";

import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { deciderSerie } from "@/server/actions/series";

/** Validation ou refus d'une série en attente (modération). */
export function DecisionSerie({ serieId, libelles }: { serieId: string; libelles: { valider: string; refuser: string; motif: string; motifRequis: string } }) {
  const routeur = useRouter();
  const [motif, setMotif] = useState("");
  const [etat, setEtat] = useState<{ enCours?: "valider" | "refuser"; erreur?: string }>({});

  async function decider(accepter: boolean) {
    if (!accepter && !motif.trim()) return setEtat({ erreur: libelles.motifRequis });
    setEtat({ enCours: accepter ? "valider" : "refuser" });
    const resultat = await deciderSerie({ serieId, accepter, motif: motif.trim() || undefined }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (resultat.ok) routeur.refresh();
    else setEtat({ erreur: resultat.erreur });
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {libelles.motif}
        <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} maxLength={1000} className="w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5 font-normal" />
      </label>
      {etat.erreur && <Message ton="erreur">{etat.erreur}</Message>}
      <div className="flex gap-2">
        <Bouton enCours={etat.enCours === "valider"} disabled={Boolean(etat.enCours)} onClick={() => decider(true)}>
          {libelles.valider}
        </Bouton>
        <Bouton variante="danger" enCours={etat.enCours === "refuser"} disabled={Boolean(etat.enCours)} onClick={() => decider(false)}>
          {libelles.refuser}
        </Bouton>
      </div>
    </div>
  );
}
