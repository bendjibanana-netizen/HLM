"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Feuille } from "@/components/ui/feuille";
import { Message } from "@/components/ui/message";
import { signaler } from "@/server/actions/communaute";

const MOTIFS = ["CONTENU_ILLEGAL", "CONTENU_SEXUEL", "MAUVAISE_CLASSIFICATION", "DROITS_AUTEUR", "SPAM", "HARCELEMENT", "AUTRE"] as const;
type Cible = "SERIE" | "CHAPITRE" | "COMMENTAIRE" | "CRITIQUE" | "UTILISATEUR";

/** Bouton « Signaler » et son formulaire. Utilisable sur une série, un chapitre, un commentaire, une critique ou un profil. */
export function Signalement({ cible, id, discret = false }: { cible: Cible; id: string; discret?: boolean }) {
  const t = useTranslations("Communaute");
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState<"repos" | "envoi" | "envoye" | "erreur">("repos");

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    setEtat("envoi");
    const resultat = await signaler({ cible, id, motif: String(f.get("motif")) as (typeof MOTIFS)[number], details: String(f.get("details") ?? "") }).catch(() => null);
    setEtat(resultat?.ok ? "envoye" : "erreur");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setEtat("repos");
          setOuvert(true);
        }}
        className={discret ? "flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-texte-doux hover:text-texte" : "flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-texte-doux hover:text-texte"}
      >
        <Flag className={discret ? "size-3.5" : "size-4"} aria-hidden />
        {t("signaler")}
      </button>
      <Feuille ouverte={ouvert} onFermer={() => setOuvert(false)} titre={t("signalerTitre")} libelleFermer={t("fermer")}>
        {etat === "envoye" ? (
          <Message ton="succes">{t("signalementEnvoye")}</Message>
        ) : (
          <form onSubmit={soumettre} className="flex flex-col gap-4">
            {etat === "erreur" && <Message ton="erreur">{t("erreurs.DEFAUT")}</Message>}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-semibold">{t("motif")}</legend>
              {MOTIFS.map((motif, index) => (
                <label key={motif} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-bordure px-3 py-2 has-checked:border-accent has-checked:bg-accent/10">
                  <input type="radio" name="motif" value={motif} defaultChecked={index === 0} required className="size-4 shrink-0 accent-(--accent)" />
                  {t(`motifs.${motif}`)}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              {t("detailsSignalement")}
              <textarea name="details" rows={3} maxLength={1000} className="w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5 font-normal" />
            </label>
            <Bouton type="submit" pleineLargeur enCours={etat === "envoi"}>
              {t("envoyerSignalement")}
            </Bouton>
          </form>
        )}
      </Feuille>
    </>
  );
}
