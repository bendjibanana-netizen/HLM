"use client";

import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { calculerPeriode, enregistrerInfosPaiement, marquerVerse } from "@/server/actions/revenus";

type Libelles = Record<string, string>;

/** Calcul (ou recalcul) de la répartition d'un mois par l'admin. */
export function FormulairePeriode({ moisPropose, pourcentage, libelles, erreurs }: { moisPropose: string; pourcentage: number; libelles: Libelles; erreurs: Libelles }) {
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    setEtat({ enCours: true });
    const resultat = await calculerPeriode({ mois: String(f.get("mois")), revenuEuros: Number(String(f.get("revenu")).replace(",", ".")), pourcentage: Number(String(f.get("pourcentage")).replace(",", ".")) }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    setEtat({ enCours: false, erreur: resultat.ok ? undefined : resultat.erreur });
    if (resultat.ok) routeur.refresh();
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Champ libelle={libelles.mois!} name="mois" type="month" defaultValue={moisPropose} required />
        <Champ libelle={libelles.revenu!} name="revenu" inputMode="decimal" required pattern="\d+([.,]\d{1,2})?" />
        <Champ libelle={libelles.pourcentage!} name="pourcentage" inputMode="decimal" defaultValue={pourcentage} required pattern="\d{1,3}([.,]\d{1,2})?" />
      </div>
      {etat.erreur && <Message ton="erreur">{erreurs[etat.erreur] ?? erreurs.DEFAUT}</Message>}
      <Bouton type="submit" enCours={etat.enCours} className="self-start">
        {libelles.calculer}
      </Bouton>
    </form>
  );
}

/** Marque une part comme versée, avec la référence du virement. */
export function BoutonVerser({ partId, libelles, erreurs }: { partId: string; libelles: Libelles; erreurs: Libelles }) {
  const routeur = useRouter();
  const [reference, setReference] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string }>({ enCours: false });

  async function verser() {
    setEtat({ enCours: true });
    const resultat = await marquerVerse(partId, reference).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    setEtat({ enCours: false, erreur: resultat.ok ? undefined : resultat.erreur });
    if (resultat.ok) routeur.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} placeholder={libelles.reference} aria-label={libelles.reference} className="h-10 w-full min-w-0 rounded-lg border border-bordure bg-surface px-3 text-sm" />
        <Bouton variante="secondaire" taille="sm" enCours={etat.enCours} onClick={verser}>
          {libelles.verser}
        </Bouton>
      </div>
      {etat.erreur && <p className="text-sm text-danger">{erreurs[etat.erreur] ?? erreurs.DEFAUT}</p>}
    </div>
  );
}

type Infos = { statutJuridique: string; raisonSociale: string; siret: string; titulaire: string; bic: string; adresse: string; ibanEnregistre: boolean };

/** Informations de paiement d'une équipe (chef d'équipe). */
export function FormulairePaiement({ equipeId, infos, libelles, statuts, erreurs }: { equipeId: string; infos: Infos; libelles: Libelles; statuts: Libelles; erreurs: Libelles }) {
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string; fait?: boolean }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    const texte = (nom: string) => String(f.get(nom) ?? "").trim();
    setEtat({ enCours: true });
    const resultat = await enregistrerInfosPaiement({
      equipeId, statutJuridique: texte("statutJuridique") as "PARTICULIER", raisonSociale: texte("raisonSociale"), siret: texte("siret"),
      titulaire: texte("titulaire"), iban: texte("iban"), bic: texte("bic"), adresse: texte("adresse"),
    }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    setEtat(resultat.ok ? { enCours: false, fait: true } : { enCours: false, erreur: resultat.erreur });
    if (resultat.ok) routeur.refresh();
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {libelles.statutJuridique}
        <select name="statutJuridique" defaultValue={infos.statutJuridique} className="h-12 rounded-xl border border-bordure bg-surface px-3 font-normal">
          {Object.entries(statuts).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </label>
      <Champ libelle={libelles.raisonSociale!} name="raisonSociale" defaultValue={infos.raisonSociale} maxLength={160} />
      <Champ libelle={libelles.siret!} name="siret" defaultValue={infos.siret} inputMode="numeric" maxLength={20} />
      <Champ libelle={libelles.titulaire!} name="titulaire" defaultValue={infos.titulaire} required minLength={2} maxLength={160} />
      <Champ libelle={libelles.iban!} name="iban" autoComplete="off" spellCheck={false} required={!infos.ibanEnregistre} placeholder={infos.ibanEnregistre ? libelles.ibanEnregistre : "FR76 …"} aide={libelles.ibanAide} />
      <Champ libelle={libelles.bic!} name="bic" defaultValue={infos.bic} maxLength={15} />
      <Champ libelle={libelles.adresse!} name="adresse" defaultValue={infos.adresse} maxLength={300} />
      {etat.erreur && <Message ton="erreur">{erreurs[etat.erreur] ?? erreurs.DEFAUT}</Message>}
      {etat.fait && <Message ton="succes">{libelles.enregistre}</Message>}
      <Bouton type="submit" enCours={etat.enCours} className="self-start">
        {libelles.enregistrer}
      </Bouton>
    </form>
  );
}
