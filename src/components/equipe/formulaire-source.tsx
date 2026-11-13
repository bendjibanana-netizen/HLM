"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { proposerSource } from "@/server/actions/sync";

const TYPES = ["RSS", "GOOGLE_DRIVE", "DISCORD", "SITE_AUTORISE"] as const;

/** Proposition d'une source de synchronisation pour une série. */
export function FormulaireSource({ serieId }: { serieId: string }) {
  const t = useTranslations("Sync");
  const routeur = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]>("RSS");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string; fait?: boolean }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const f = new FormData(formulaire);
    const texte = (nom: string) => String(f.get(nom) ?? "").trim() || undefined;
    setEtat({ enCours: true });
    const resultat = await proposerSource({
      serieId, type, nom: texte("nom") ?? "", url: texte("url") ?? "", selecteurChapitres: texte("selecteurChapitres"), selecteurImages: texte("selecteurImages"),
      salonId: texte("salonId"), jeton: texte("jeton"), autorisationNote: texte("autorisation") ?? "",
    }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (!resultat.ok) return setEtat({ enCours: false, erreur: resultat.erreur });
    formulaire.reset();
    setEtat({ enCours: false, fait: true });
    routeur.refresh();
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("type")}
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-12 rounded-xl border border-bordure bg-surface px-3 font-normal">
          {TYPES.map((valeur) => (
            <option key={valeur} value={valeur}>
              {t(`types.${valeur}`)}
            </option>
          ))}
        </select>
      </label>
      <Champ libelle={t("nom")} name="nom" required minLength={2} maxLength={80} />
      {type !== "DISCORD" && <Champ libelle={t("url")} name="url" type="url" inputMode="url" required placeholder="https://…" />}
      {type === "SITE_AUTORISE" && (
        <>
          <Champ libelle={t("selecteurChapitres")} name="selecteurChapitres" required placeholder="ul.chapitres a" />
          <Champ libelle={t("selecteurImages")} name="selecteurImages" required placeholder="div.planches img" />
        </>
      )}
      {type === "DISCORD" && (
        <>
          <Champ libelle={t("salonId")} name="salonId" inputMode="numeric" required />
          <Champ libelle={t("jeton")} name="jeton" type="password" autoComplete="off" required aide={t("jetonAide")} />
        </>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("autorisation")}
        <textarea name="autorisation" rows={2} required minLength={10} maxLength={2000} className="w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5 font-normal" />
        <span className="font-normal text-texte-doux">{t("autorisationAide")}</span>
      </label>
      {etat.erreur && <Message ton="erreur">{t.has(`erreurs.${etat.erreur}`) ? t(`erreurs.${etat.erreur}`) : t("erreurs.DEFAUT")}</Message>}
      {etat.fait && <Message ton="succes">{t("proposee")}</Message>}
      <Bouton type="submit" variante="secondaire" enCours={etat.enCours} className="self-start">
        {t("envoyer")}
      </Bouton>
    </form>
  );
}
