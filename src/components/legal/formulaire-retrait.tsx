"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { deposerDemandeRetrait } from "@/server/actions/moderation";

const CLASSES_ZONE = "w-full rounded-xl border border-bordure bg-surface px-3.5 py-2.5 font-normal";

/** Formulaire public de demande de retrait, destiné aux ayants droit. */
export function FormulaireRetrait() {
  const t = useTranslations("Retrait");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string; reference?: string }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    const texte = (nom: string) => String(f.get(nom) ?? "").trim();
    setEtat({ enCours: true });
    const resultat = await deposerDemandeRetrait({
      nomDemandeur: texte("nom"),
      qualite: texte("qualite") as "AYANT_DROIT" | "REPRESENTANT",
      organisation: texte("organisation") || undefined,
      email: texte("email"),
      telephone: texte("telephone") || undefined,
      adresse: texte("adresse") || undefined,
      oeuvre: texte("oeuvre"),
      descriptionDroits: texte("droits"),
      urls: texte("urls").split("\n").map((ligne) => ligne.trim()).filter(Boolean),
      declarationSurHonneur: (f.get("declaration") === "on") as true,
      signature: texte("signature"),
      site: texte("site"),
    }).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    setEtat(resultat.ok ? { enCours: false, reference: resultat.reference } : { enCours: false, erreur: resultat.erreur });
  }

  if (etat.reference) {
    return (
      <Message ton="succes">
        <strong className="block">{t("envoyee")}</strong>
        {t("envoyeeTexte", { reference: etat.reference })}
      </Message>
    );
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{t("identite")}</h2>
      <Champ libelle={t("nom")} name="nom" autoComplete="name" required minLength={2} maxLength={120} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("qualite")}
        <select name="qualite" className="h-12 rounded-xl border border-bordure bg-surface px-3 font-normal">
          <option value="AYANT_DROIT">{t("ayantDroit")}</option>
          <option value="REPRESENTANT">{t("representant")}</option>
        </select>
      </label>
      <Champ libelle={t("organisation")} name="organisation" autoComplete="organization" maxLength={160} />
      <Champ libelle={t("email")} name="email" type="email" inputMode="email" autoComplete="email" required />
      <Champ libelle={t("telephone")} name="telephone" type="tel" autoComplete="tel" maxLength={40} />
      <Champ libelle={t("adresse")} name="adresse" autoComplete="street-address" maxLength={300} />
      {/* Champ piège : invisible pour les personnes, rempli par les robots de spam. */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />

      <h2 className="mt-2 text-xl font-bold">{t("oeuvreSection")}</h2>
      <Champ libelle={t("oeuvre")} name="oeuvre" required minLength={2} maxLength={200} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("droits")}
        <textarea name="droits" rows={4} required minLength={20} maxLength={3000} className={CLASSES_ZONE} />
        <span className="font-normal text-texte-doux">{t("droitsAide")}</span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("urls")}
        <textarea name="urls" rows={3} required placeholder="https://…" className={CLASSES_ZONE} />
        <span className="font-normal text-texte-doux">{t("urlsAide")}</span>
      </label>

      <label className="flex cursor-pointer gap-3 rounded-2xl border border-bordure bg-surface-2 p-4 font-semibold">
        <input type="checkbox" name="declaration" required className="mt-1 size-5 shrink-0 accent-(--accent)" />
        {t("declaration")}
      </label>
      <Champ libelle={t("signature")} name="signature" required minLength={2} maxLength={120} />

      {etat.erreur && <Message ton="erreur">{t.has(`erreurs.${etat.erreur}`) ? t(`erreurs.${etat.erreur}`) : t("erreurs.DEFAUT")}</Message>}
      <Bouton type="submit" taille="lg" enCours={etat.enCours} className="self-start">
        {t("envoyer")}
      </Bouton>
    </form>
  );
}
