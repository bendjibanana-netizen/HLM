"use client";

import { Bell, BellRing, ListPlus, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton, LienBouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Feuille } from "@/components/ui/feuille";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { basculerDansListe, creerListe, definirStatut, noterSerie, suivreSerie, type TypeStatut } from "@/server/actions/communaute";

type Etat = { note: number | null; suivi: boolean; statut: string | null; listes: { id: string; nom: string; present: boolean }[] };
const STATUTS: TypeStatut[] = ["A_LIRE", "EN_COURS", "TERMINE", "ABANDONNE"];

/** Sélecteur de note à la demi-étoile : dix zones cliquables, deux par étoile. */
function SelecteurNote({ valeur, onChange, libelle }: { valeur: number | null; onChange: (valeur: number) => void; libelle: (note: string) => string }) {
  const [survol, setSurvol] = useState<number | null>(null);
  const affichee = survol ?? valeur ?? 0;
  return (
    <div className="flex" role="radiogroup" onPointerLeave={() => setSurvol(null)}>
      {Array.from({ length: 5 }, (_, etoile) => (
        <span key={etoile} className="relative size-10">
          <Star className="absolute inset-1 size-8 text-bordure" strokeWidth={1.5} aria-hidden />
          {/* Étoile pleine, rognée à moitié pour une demi-étoile */}
          <span className="absolute inset-1 overflow-hidden" style={{ width: affichee >= etoile * 2 + 2 ? "2rem" : affichee === etoile * 2 + 1 ? "1rem" : 0 }}>
            <Star className="size-8 fill-accent text-accent" strokeWidth={0} aria-hidden />
          </span>
          {[1, 2].map((demi) => {
            const note = etoile * 2 + demi;
            return (
              <button
                key={demi}
                type="button"
                role="radio"
                aria-checked={valeur === note}
                aria-label={libelle((note / 2).toLocaleString())}
                onPointerEnter={(e) => e.pointerType === "mouse" && setSurvol(note)}
                onClick={() => onChange(note)}
                className={cn("absolute inset-y-0 w-1/2", demi === 1 ? "left-0" : "right-0")}
              />
            );
          })}
        </span>
      ))}
    </div>
  );
}

/** Actions d'un lecteur sur une série : suivre, noter, classer dans ses listes. */
export function ActionsSerie({ serieId, initial, connecte, suiteConnexion }: { serieId: string; initial: Etat; connecte: boolean; suiteConnexion: string }) {
  const t = useTranslations("Communaute");
  const routeur = useRouter();
  const [etat, setEtat] = useState(initial);
  const [listesOuvertes, setListesOuvertes] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!connecte) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-bordure bg-surface p-4">
        <p className="text-sm text-texte-doux">{t("connexionRequise")}</p>
        <LienBouton href={{ pathname: "/connexion", query: { suite: suiteConnexion } }} variante="secondaire" taille="sm" className="self-start">
          {t("suivre")}
        </LienBouton>
      </div>
    );
  }

  /** Applique tout de suite le changement à l'écran, puis le confirme auprès du serveur (ou l'annule). */
  async function appliquer(changement: Partial<Etat>, action: () => Promise<{ ok: boolean; erreur?: string }>) {
    const precedent = etat;
    setEtat({ ...etat, ...changement });
    setErreur(null);
    const resultat = await action().catch(() => ({ ok: false, erreur: "DEFAUT" }));
    if (!resultat.ok) {
      setEtat(precedent);
      setErreur(resultat.erreur ?? "DEFAUT");
    } else routeur.refresh();
  }

  async function nouvelleListe(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const f = new FormData(formulaire);
    const resultat = await creerListe({ nom: String(f.get("nom")), publique: f.get("publique") === "on" }).catch(() => null);
    if (!resultat?.ok) return setErreur(resultat?.erreur ?? "DEFAUT");
    formulaire.reset();
    await basculerDansListe(resultat.id, serieId);
    setEtat((actuel) => ({ ...actuel, listes: [...actuel.listes, { id: resultat.id, nom: String(f.get("nom")), present: true }] }));
    routeur.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-bordure bg-surface p-4">
      {erreur && <Message ton="erreur">{t.has(`erreurs.${erreur}`) ? t(`erreurs.${erreur}`) : t("erreurs.DEFAUT")}</Message>}
      <div className="flex flex-wrap gap-2">
        <Bouton variante={etat.suivi ? "secondaire" : "primaire"} taille="sm" aria-pressed={etat.suivi} onClick={() => appliquer({ suivi: !etat.suivi }, () => suivreSerie(serieId))}>
          {etat.suivi ? <BellRing className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
          {etat.suivi ? t("suivi") : t("suivre")}
        </Bouton>
        <Bouton variante="secondaire" taille="sm" onClick={() => setListesOuvertes(true)}>
          <ListPlus className="size-4" aria-hidden />
          {t("ajouterListe")}
        </Bouton>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-semibold">{t("maNote")}</span>
        <SelecteurNote valeur={etat.note} libelle={(note) => t("noter", { note })} onChange={(note) => appliquer({ note }, () => noterSerie(serieId, note))} />
        {etat.note !== null && (
          <button type="button" onClick={() => appliquer({ note: null }, () => noterSerie(serieId, null))} className="h-8 rounded-md px-2 text-xs font-semibold text-texte-doux hover:text-texte">
            {t("retirerNote")}
          </button>
        )}
      </div>

      <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        {t("statut")}
        <select
          value={etat.statut ?? ""}
          onChange={(e) => appliquer({ statut: e.target.value || null }, () => definirStatut(serieId, (e.target.value || null) as TypeStatut | null))}
          className="h-10 rounded-xl border border-bordure bg-surface px-3 font-normal"
        >
          <option value="">{t("aucunStatut")}</option>
          {STATUTS.map((statut) => (
            <option key={statut} value={statut}>
              {t(`statuts.${statut}`)}
            </option>
          ))}
        </select>
      </label>

      <Feuille ouverte={listesOuvertes} onFermer={() => setListesOuvertes(false)} titre={t("ajouterListe")} libelleFermer={t("fermer")}>
        <div className="flex flex-col gap-4">
          {etat.listes.length === 0 ? (
            <p className="text-sm text-texte-doux">{t("aucuneListe")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {etat.listes.map((liste) => (
                <li key={liste.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-bordure px-3 has-checked:border-accent has-checked:bg-accent/10">
                    <input
                      type="checkbox"
                      checked={liste.present}
                      onChange={() => appliquer({ listes: etat.listes.map((l) => (l.id === liste.id ? { ...l, present: !l.present } : l)) }, () => basculerDansListe(liste.id, serieId))}
                      className="size-4 shrink-0 accent-(--accent)"
                    />
                    {liste.nom}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={nouvelleListe} className="flex flex-col gap-3 border-t border-bordure pt-4">
            <Champ libelle={t("nouvelleListe")} name="nom" placeholder={t("nomListe")} required maxLength={60} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="publique" defaultChecked className="size-4 accent-(--accent)" />
              {t("listePublique")}
            </label>
            <Bouton type="submit" variante="secondaire" className="self-start">
              {t("creer")}
            </Bouton>
          </form>
        </div>
      </Feuille>
    </div>
  );
}
