"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { creerSerie, modifierSerie, type DonneesSerie } from "@/server/actions/series";

type Genre = { slug: string; nom: string };
export type ValeursSerie = Omit<DonneesSerie, "droitsDeclares"> & { droitsDeclares: boolean };

const CLASSES_SAISIE = "w-full rounded-xl border border-bordure bg-surface px-3.5 text-texte focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function Liste({ libelle, nom, valeur, options, aide }: { libelle: string; nom: string; valeur: string; options: { valeur: string; libelle: string }[]; aide?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {libelle}
      <select name={nom} defaultValue={valeur} className={`${CLASSES_SAISIE} h-12 font-normal`}>
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.libelle}
          </option>
        ))}
      </select>
      {aide && <span className="font-normal text-texte-doux">{aide}</span>}
    </label>
  );
}

/** Création ou modification d'une série. Avec `serieId` : modification ; avec `equipeId` : création. */
export function FormulaireSerie({ equipeId, serieId, valeurs, genres }: { equipeId?: string; serieId?: string; valeurs: ValeursSerie; genres: Genre[] }) {
  const t = useTranslations();
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string; fait?: boolean }>({ enCours: false });

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    const texte = (nom: string) => String(f.get(nom) ?? "").trim();
    const annee = Number(texte("anneeParution"));
    const donnees = {
      titre: texte("titre"),
      titresAlternatifs: texte("titresAlternatifs").split("\n").map((ligne) => ligne.trim()).filter(Boolean),
      synopsis: texte("synopsis"),
      type: texte("type"),
      langue: texte("langue"),
      statut: texte("statut"),
      classification: texte("classification"),
      sensLecture: texte("sensLecture"),
      anneeParution: annee > 0 ? annee : null,
      auteurs: texte("auteurs").split(",").map((nom) => nom.trim()).filter(Boolean),
      genres: f.getAll("genres").map(String),
      droitsDeclares: f.get("droitsDeclares") === "on",
      preuveAutorisationNote: texte("preuveAutorisationNote"),
    } as DonneesSerie;

    setEtat({ enCours: true });
    const resultat = await (serieId ? modifierSerie(serieId, donnees) : creerSerie(equipeId!, donnees)).catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    if (!resultat.ok) return setEtat({ enCours: false, erreur: resultat.erreur });
    if ("id" in resultat) routeur.push({ pathname: "/equipe/series/[id]", params: { id: String(resultat.id) } });
    else {
      setEtat({ enCours: false, fait: true });
      routeur.refresh();
    }
  }

  const options = (espace: string, valeursPossibles: string[]) => valeursPossibles.map((valeur) => ({ valeur, libelle: t(`${espace}.${valeur}`) }));

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <Champ libelle={t("Equipe.serie.titre")} name="titre" defaultValue={valeurs.titre} required maxLength={120} />
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("Equipe.serie.titresAlternatifs")}
        <textarea name="titresAlternatifs" defaultValue={valeurs.titresAlternatifs.join("\n")} rows={2} className={`${CLASSES_SAISIE} py-2.5 font-normal`} />
        <span className="font-normal text-texte-doux">{t("Equipe.serie.titresAide")}</span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t("Equipe.serie.synopsis")}
        <textarea name="synopsis" defaultValue={valeurs.synopsis} rows={5} maxLength={5000} className={`${CLASSES_SAISIE} py-2.5 font-normal`} />
      </label>
      <Champ libelle={t("Equipe.serie.auteurs")} name="auteurs" defaultValue={valeurs.auteurs.join(", ")} aide={t("Equipe.serie.auteursAide")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Liste libelle={t("Equipe.serie.type")} nom="type" valeur={valeurs.type} options={options("Type", ["WEBTOON", "MANGA", "MANHWA", "MANHUA"])} />
        <Liste libelle={t("Equipe.serie.langue")} nom="langue" valeur={valeurs.langue} options={options("LangueSerie", ["FR", "EN"])} />
        <Liste libelle={t("Equipe.serie.statut")} nom="statut" valeur={valeurs.statut} options={options("Statut", ["EN_COURS", "TERMINE", "EN_PAUSE", "ABANDONNE"])} />
        <Liste
          libelle={t("Equipe.serie.sens")}
          nom="sensLecture"
          valeur={valeurs.sensLecture}
          options={[
            { valeur: "VERTICAL", libelle: t("Equipe.serie.sensVertical") },
            { valeur: "DROITE_A_GAUCHE", libelle: t("Equipe.serie.sensRtl") },
            { valeur: "GAUCHE_A_DROITE", libelle: t("Equipe.serie.sensLtr") },
          ]}
        />
        <Liste
          libelle={t("Equipe.serie.classification")}
          nom="classification"
          valeur={valeurs.classification}
          options={options("Classification", ["TOUT_PUBLIC", "DOUZE_PLUS", "SEIZE_PLUS"])}
          aide={t("Equipe.serie.classificationAide")}
        />
        <Champ libelle={t("Equipe.serie.annee")} name="anneeParution" type="number" inputMode="numeric" min={1900} max={2100} defaultValue={valeurs.anneeParution ?? ""} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("Equipe.serie.genres")}</legend>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <label key={genre.slug} className="flex h-10 cursor-pointer items-center rounded-full border border-bordure px-3.5 text-sm font-semibold select-none has-checked:border-accent has-checked:bg-accent has-checked:text-sur-accent">
              <input type="checkbox" name="genres" value={genre.slug} defaultChecked={valeurs.genres.includes(genre.slug)} className="sr-only" />
              {genre.nom}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Déclaration obligatoire sur les droits */}
      <div className="flex flex-col gap-3 rounded-2xl border border-bordure bg-surface-2 p-4">
        <label className="flex cursor-pointer gap-3 font-semibold">
          <input type="checkbox" name="droitsDeclares" defaultChecked={valeurs.droitsDeclares} required className="mt-1 size-5 shrink-0 accent-(--accent)" />
          {t("Equipe.serie.droits")}
        </label>
        <p className="text-sm text-texte-doux">{t("Equipe.serie.droitsAide")}</p>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t("Equipe.serie.preuveNote")}
          <textarea name="preuveAutorisationNote" defaultValue={valeurs.preuveAutorisationNote} rows={2} maxLength={2000} className={`${CLASSES_SAISIE} py-2.5 font-normal`} />
          <span className="font-normal text-texte-doux">{t("Equipe.serie.preuveNoteAide")}</span>
        </label>
      </div>

      {etat.erreur && <Message ton="erreur">{t.has(`Equipe.erreurs.${etat.erreur}`) ? t(`Equipe.erreurs.${etat.erreur}`) : t("Equipe.erreurs.DEFAUT")}</Message>}
      {etat.fait && <Message ton="succes">{t("Equipe.serie.enregistree")}</Message>}
      <Bouton type="submit" taille="lg" enCours={etat.enCours} className="self-start">
        {serieId ? t("Equipe.serie.enregistrer") : t("Equipe.serie.creer")}
      </Bouton>
    </form>
  );
}
