"use client";

import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { deciderDemandeRetrait, traiterSignalement } from "@/server/actions/moderation";

const ZONE = "w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5 font-normal";

/** Décision sur un signalement : rejeter, retirer le contenu, ou retirer et suspendre son auteur. */
export function DecisionSignalement({ signalementId, suspensionPossible, libelles }: { signalementId: string; suspensionPossible: boolean; libelles: { note: string; rejeter: string; retirer: string; suspendre: string } }) {
  const routeur = useRouter();
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);

  async function decider(decision: "REJETER" | "RETIRER" | "SUSPENDRE") {
    setEnCours(decision);
    setErreur(false);
    const resultat = await traiterSignalement({ signalementId, decision, commentaire: note.trim() || undefined }).catch(() => null);
    if (resultat?.ok) routeur.refresh();
    else setErreur(true);
    setEnCours(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={libelles.note} aria-label={libelles.note} className={`${ZONE} h-11 py-0`} />
      {erreur && <Message ton="erreur">Erreur</Message>}
      <div className="flex flex-wrap gap-2">
        <Bouton variante="secondaire" taille="sm" enCours={enCours === "REJETER"} disabled={Boolean(enCours)} onClick={() => decider("REJETER")}>
          {libelles.rejeter}
        </Bouton>
        <Bouton variante="danger" taille="sm" enCours={enCours === "RETIRER"} disabled={Boolean(enCours)} onClick={() => decider("RETIRER")}>
          {libelles.retirer}
        </Bouton>
        {suspensionPossible && (
          <Bouton variante="danger" taille="sm" enCours={enCours === "SUSPENDRE"} disabled={Boolean(enCours)} onClick={() => decider("SUSPENDRE")}>
            {libelles.suspendre}
          </Bouton>
        )}
      </div>
    </div>
  );
}

/** Décision de l'admin sur une demande de retrait. */
export function DecisionRetrait({
  demandeId,
  serieProposee,
  series,
  libelles,
}: {
  demandeId: string;
  serieProposee: string | null;
  series: { id: string; titre: string }[];
  libelles: { serie: string; aucuneSerie: string; reponse: string; accepter: string; refuser: string; equipeSuspendue: string; erreurs: Record<string, string> };
}) {
  const routeur = useRouter();
  const [serieId, setSerieId] = useState(serieProposee ?? "");
  const [reponse, setReponse] = useState("");
  const [etat, setEtat] = useState<{ enCours?: string; erreur?: string; suspendue?: boolean }>({});

  async function decider(accepter: boolean) {
    setEtat({ enCours: accepter ? "accepter" : "refuser" });
    const resultat = await deciderDemandeRetrait({ demandeId, accepter, serieId: serieId || undefined, reponse }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (!resultat.ok) return setEtat({ erreur: resultat.erreur });
    setEtat({ suspendue: resultat.equipeSuspendue });
    routeur.refresh();
  }

  if (etat.suspendue) return <Message ton="info">{libelles.equipeSuspendue}</Message>;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {libelles.serie}
        <select value={serieId} onChange={(e) => setSerieId(e.target.value)} className="h-11 rounded-xl border border-bordure bg-surface px-3 font-normal">
          <option value="">{libelles.aucuneSerie}</option>
          {series.map((serie) => (
            <option key={serie.id} value={serie.id}>
              {serie.titre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {libelles.reponse}
        <textarea value={reponse} onChange={(e) => setReponse(e.target.value)} rows={3} maxLength={3000} className={ZONE} />
      </label>
      {etat.erreur && <Message ton="erreur">{libelles.erreurs[etat.erreur] ?? libelles.erreurs.DEFAUT}</Message>}
      <div className="flex flex-wrap gap-2">
        <Bouton variante="danger" taille="sm" enCours={etat.enCours === "accepter"} disabled={Boolean(etat.enCours)} onClick={() => decider(true)}>
          {libelles.accepter}
        </Bouton>
        <Bouton variante="secondaire" taille="sm" enCours={etat.enCours === "refuser"} disabled={Boolean(etat.enCours)} onClick={() => decider(false)}>
          {libelles.refuser}
        </Bouton>
      </div>
    </div>
  );
}
