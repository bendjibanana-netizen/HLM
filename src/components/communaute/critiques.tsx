"use client";

import { Heart } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Etoiles } from "@/components/ui/etoiles";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { aimerCritique, enregistrerCritique, supprimerCritique } from "@/server/actions/communaute";
import { Auteur } from "./auteur";
import { Signalement } from "./signalement";

type Critique = {
  id: string; contenu: string; spoiler: boolean; nbLikes: number; creeLe: string; note: number | null; aime: boolean; aMoi: boolean;
  user: { pseudo: string; name: string; image: string | null };
};

function CarteCritique({ critique, connecte }: { critique: Critique; connecte: boolean }) {
  const t = useTranslations("Communaute");
  const format = useFormatter();
  const [revelee, setRevelee] = useState(!critique.spoiler);
  const [jaime, setJaime] = useState({ aime: critique.aime, nombre: critique.nbLikes });

  async function aimer() {
    if (!connecte) return;
    const precedent = jaime;
    setJaime({ aime: !jaime.aime, nombre: jaime.nombre + (jaime.aime ? -1 : 1) });
    const resultat = await aimerCritique(critique.id).catch(() => null);
    setJaime(resultat?.ok ? { aime: resultat.aime, nombre: resultat.nombre } : precedent);
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-bordure bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Auteur compte={critique.user} />
        <div className="flex items-center gap-2 text-sm text-texte-doux">
          {critique.note !== null && <Etoiles note={critique.note} libelle={`${critique.note / 2} / 5`} taille="sm" />}
          <time dateTime={critique.creeLe}>{format.dateTime(new Date(critique.creeLe), { dateStyle: "medium" })}</time>
        </div>
      </div>
      {revelee ? (
        <p className="leading-relaxed whitespace-pre-line">{critique.contenu}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 p-3 text-sm">
          <span className="text-texte-doux">{t("contientSpoiler")}</span>
          <button type="button" onClick={() => setRevelee(true)} className="h-8 rounded-md font-semibold text-accent hover:underline">
            {t("afficher")}
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={aimer}
          disabled={!connecte}
          aria-pressed={jaime.aime}
          className={cn("flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold", jaime.aime ? "text-accent" : "text-texte-doux enabled:hover:text-texte")}
        >
          <Heart className={cn("size-4", jaime.aime && "fill-current")} aria-hidden />
          {t("jaimeNombre", { nombre: jaime.nombre })}
        </button>
        {!critique.aMoi && <Signalement cible="CRITIQUE" id={critique.id} discret />}
      </div>
    </li>
  );
}

/** Critiques d'une série et formulaire pour écrire ou modifier la sienne. */
export function Critiques({ serieId, critiques, maCritique, connecte }: { serieId: string; critiques: Critique[]; maCritique: { id: string; contenu: string; spoiler: boolean } | null; connecte: boolean }) {
  const t = useTranslations("Communaute");
  const routeur = useRouter();
  const [edition, setEdition] = useState(false);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    setEtat({ enCours: true });
    const resultat = await enregistrerCritique({ serieId, contenu: String(f.get("contenu")), spoiler: f.get("spoiler") === "on" }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (!resultat.ok) return setEtat({ enCours: false, erreur: resultat.erreur });
    setEtat({ enCours: false });
    setEdition(false);
    routeur.refresh();
  }

  async function supprimer() {
    if (!maCritique || !window.confirm(t("confirmerSuppression"))) return;
    await supprimerCritique(maCritique.id);
    setEdition(false);
    routeur.refresh();
  }

  return (
    <section aria-labelledby="titre-critiques" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titre-critiques" className="text-xl font-bold">
          {t("critiques")} <span className="text-base font-semibold text-texte-doux">({critiques.length})</span>
        </h2>
        {connecte && !edition && (
          <Bouton variante="secondaire" taille="sm" onClick={() => setEdition(true)}>
            {maCritique ? t("modifierCritique") : t("ecrireCritique")}
          </Bouton>
        )}
      </div>

      {edition && (
        <form onSubmit={soumettre} className="flex flex-col gap-3 rounded-2xl border border-bordure bg-surface p-4">
          {etat.erreur && <Message ton="erreur">{t.has(`erreurs.${etat.erreur}`) ? t(`erreurs.${etat.erreur}`) : t("erreurs.DEFAUT")}</Message>}
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("maCritique")}
            <textarea name="contenu" defaultValue={maCritique?.contenu} rows={5} minLength={20} maxLength={5000} required placeholder={t("critiquePlaceholder")} className="w-full rounded-xl border border-bordure bg-fond px-3.5 py-2.5 font-normal" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="spoiler" defaultChecked={maCritique?.spoiler} className="size-4 accent-(--accent)" />
            {t("spoiler")}
          </label>
          <div className="flex flex-wrap gap-2">
            <Bouton type="submit" enCours={etat.enCours}>
              {t("publier")}
            </Bouton>
            <Bouton variante="discret" onClick={() => setEdition(false)}>
              {t("annuler")}
            </Bouton>
            {maCritique && (
              <Bouton variante="danger" onClick={supprimer} className="ml-auto">
                {t("supprimer")}
              </Bouton>
            )}
          </div>
        </form>
      )}

      {critiques.length === 0 ? (
        <p className="text-texte-doux">{t("aucuneCritique")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {critiques.map((critique) => (
            <CarteCritique key={critique.id} critique={critique} connecte={connecte} />
          ))}
        </ul>
      )}
    </section>
  );
}
