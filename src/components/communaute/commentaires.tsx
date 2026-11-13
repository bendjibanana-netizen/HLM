"use client";

import { Heart, MessageCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { cn } from "@/lib/cn";
import { aimerCommentaire, commenter, supprimerCommentaire } from "@/server/actions/communaute";
import { Auteur } from "./auteur";
import { Signalement } from "./signalement";

type Commentaire = {
  id: string; contenu: string; nbLikes: number; creeLe: string; aime: boolean; aMoi: boolean;
  user: { pseudo: string; name: string; image: string | null };
};
type Fil = Commentaire & { reponses: Commentaire[] };

function Saisie({ placeholder, libelle, onEnvoyer, onAnnuler }: { placeholder: string; libelle: string; onEnvoyer: (contenu: string) => Promise<string | null>; onAnnuler?: () => void }) {
  const t = useTranslations("Communaute");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    setEtat({ enCours: true });
    const erreur = await onEnvoyer(String(new FormData(formulaire).get("contenu")));
    setEtat({ enCours: false, erreur: erreur ?? undefined });
    if (!erreur) formulaire.reset();
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-2">
      {etat.erreur && <Message ton="erreur">{t.has(`erreurs.${etat.erreur}`) ? t(`erreurs.${etat.erreur}`) : t("erreurs.DEFAUT")}</Message>}
      <textarea name="contenu" rows={2} maxLength={2000} required placeholder={placeholder} aria-label={placeholder} className="w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5" />
      <div className="flex gap-2">
        <Bouton type="submit" taille="sm" enCours={etat.enCours}>
          {libelle}
        </Bouton>
        {onAnnuler && (
          <Bouton variante="discret" taille="sm" onClick={onAnnuler}>
            {t("annuler")}
          </Bouton>
        )}
      </div>
    </form>
  );
}

function Ligne({ commentaire, connecte, onRepondre, onSupprimer }: { commentaire: Commentaire; connecte: boolean; onRepondre?: () => void; onSupprimer: () => void }) {
  const t = useTranslations("Communaute");
  const format = useFormatter();
  const [jaime, setJaime] = useState({ aime: commentaire.aime, nombre: commentaire.nbLikes });

  async function aimer() {
    const precedent = jaime;
    setJaime({ aime: !jaime.aime, nombre: jaime.nombre + (jaime.aime ? -1 : 1) });
    const resultat = await aimerCommentaire(commentaire.id).catch(() => null);
    setJaime(resultat?.ok ? { aime: resultat.aime, nombre: resultat.nombre } : precedent);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <Auteur compte={commentaire.user} />
        <time dateTime={commentaire.creeLe} className="shrink-0 text-xs text-texte-doux">
          {format.relativeTime(new Date(commentaire.creeLe))}
        </time>
      </div>
      <p className="pl-10 whitespace-pre-line">{commentaire.contenu}</p>
      <div className="flex flex-wrap items-center gap-1 pl-8">
        <button
          type="button"
          onClick={aimer}
          disabled={!connecte}
          aria-pressed={jaime.aime}
          className={cn("flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-semibold", jaime.aime ? "text-accent" : "text-texte-doux enabled:hover:text-texte")}
        >
          <Heart className={cn("size-3.5", jaime.aime && "fill-current")} aria-hidden />
          {t("jaimeNombre", { nombre: jaime.nombre })}
        </button>
        {connecte && onRepondre && (
          <button type="button" onClick={onRepondre} className="h-8 rounded-md px-1.5 text-xs font-semibold text-texte-doux hover:text-texte">
            {t("repondre")}
          </button>
        )}
        {commentaire.aMoi ? (
          <button type="button" onClick={onSupprimer} className="h-8 rounded-md px-1.5 text-xs font-semibold text-texte-doux hover:text-danger">
            {t("supprimer")}
          </button>
        ) : (
          <Signalement cible="COMMENTAIRE" id={commentaire.id} discret />
        )}
      </div>
    </div>
  );
}

/** Commentaires d'un chapitre, chargés quand le lecteur les demande. */
export function Commentaires({ chapitreId, nombre }: { chapitreId: string; nombre: number }) {
  const t = useTranslations("Communaute");
  const [fils, setFils] = useState<Fil[] | null>(null);
  const [connecte, setConnecte] = useState(false);
  const [reponseA, setReponseA] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    const donnees = (await fetch(`/api/commentaires?chapitre=${chapitreId}`).then((r) => r.json()).catch(() => null)) as { commentaires: Fil[]; connecte: boolean } | null;
    setFils(donnees?.commentaires ?? []);
    setConnecte(Boolean(donnees?.connecte));
    setChargement(false);
  }, [chapitreId]);

  async function envoyer(contenu: string, parentId?: string): Promise<string | null> {
    const resultat = await commenter({ chapitreId, contenu, parentId }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (!resultat.ok) return resultat.erreur;
    setReponseA(null);
    await charger();
    return null;
  }

  async function supprimer(id: string) {
    if (!window.confirm(t("confirmerSuppression"))) return;
    await supprimerCommentaire(id);
    await charger();
  }

  if (fils === null) {
    return (
      <Bouton variante="secondaire" pleineLargeur enCours={chargement} onClick={charger}>
        <MessageCircle className="size-4" aria-hidden />
        {t("afficherCommentaires", { nombre })}
      </Bouton>
    );
  }

  return (
    <section aria-labelledby="titre-commentaires" className="flex w-full flex-col gap-4 text-left">
      <h2 id="titre-commentaires" className="text-xl font-bold">
        {t("commentaires")} <span className="text-base font-semibold text-texte-doux">({fils.reduce((total, fil) => total + 1 + fil.reponses.length, 0)})</span>
      </h2>
      {connecte ? <Saisie placeholder={t("commentairePlaceholder")} libelle={t("commenter")} onEnvoyer={(contenu) => envoyer(contenu)} /> : <p className="text-sm text-texte-doux">{t("connexionRequise")}</p>}
      {fils.length === 0 && <p className="text-texte-doux">{t("aucunCommentaire")}</p>}
      <ul className="flex flex-col gap-4">
        {fils.map((fil) => (
          <li key={fil.id} className="flex flex-col gap-3">
            <Ligne commentaire={fil} connecte={connecte} onRepondre={() => setReponseA(fil.id)} onSupprimer={() => supprimer(fil.id)} />
            {(fil.reponses.length > 0 || reponseA === fil.id) && (
              <div className="ml-4 flex flex-col gap-3 border-l-2 border-bordure pl-3">
                {fil.reponses.map((reponse) => (
                  <Ligne key={reponse.id} commentaire={reponse} connecte={connecte} onSupprimer={() => supprimer(reponse.id)} />
                ))}
                {reponseA === fil.id && <Saisie placeholder={t("reponsePlaceholder")} libelle={t("repondre")} onEnvoyer={(contenu) => envoyer(contenu, fil.id)} onAnnuler={() => setReponseA(null)} />}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
