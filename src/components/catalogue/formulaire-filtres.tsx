import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { classesBouton } from "@/components/ui/bouton";
import { Link } from "@/i18n/navigation";
import { CLASSIFICATIONS, LANGUES, STATUTS, TRIS, TYPES, type Criteres } from "@/lib/recherche/criteres";

type Genre = { slug: string; nom: string };

/** Case à cocher ou bouton radio présenté comme une pastille (cible tactile de 40 px). */
function Pastille({ type, nom, valeur, coche, children }: { type: "checkbox" | "radio"; nom: string; valeur: string; coche: boolean; children: ReactNode }) {
  return (
    <label className="flex h-10 cursor-pointer items-center rounded-full border border-bordure px-3.5 text-sm font-semibold transition select-none has-checked:border-accent has-checked:bg-accent has-checked:text-sur-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
      <input type={type} name={nom} value={valeur} defaultChecked={coche} className="sr-only" />
      {children}
    </label>
  );
}

function Groupe({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">{titre}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * Filtres du catalogue. Formulaire GET classique : les choix deviennent des paramètres d'URL,
 * donc une recherche filtrée se partage et se retrouve avec le bouton « retour ».
 */
export function FormulaireFiltres({ action, criteres, genres }: { action: string; criteres: Criteres; genres: Genre[] }) {
  const t = useTranslations();

  return (
    <form action={action} method="get" className="flex flex-col gap-5">
      {criteres.requete && <input type="hidden" name="q" value={criteres.requete} />}

      <label className="flex flex-col gap-2 text-sm font-bold">
        {t("Catalogue.tri")}
        <select name="tri" defaultValue={criteres.tri} className="h-11 rounded-xl border border-bordure bg-surface px-3 font-normal">
          {TRIS.filter((tri) => tri !== "pertinence" || criteres.requete).map((tri) => (
            <option key={tri} value={tri}>
              {t(`Catalogue.tris.${tri}`)}
            </option>
          ))}
        </select>
      </label>

      <Groupe titre={t("Catalogue.type")}>
        {TYPES.map((type) => (
          <Pastille key={type} type="checkbox" nom="type" valeur={type} coche={criteres.types.includes(type)}>
            {t(`Type.${type}`)}
          </Pastille>
        ))}
      </Groupe>
      <Groupe titre={t("Catalogue.langue")}>
        {LANGUES.map((langue) => (
          <Pastille key={langue} type="checkbox" nom="langue" valeur={langue} coche={criteres.langues.includes(langue)}>
            {t(`LangueSerie.${langue}`)}
          </Pastille>
        ))}
      </Groupe>
      <Groupe titre={t("Catalogue.genres")}>
        {genres.map((genre) => (
          <Pastille key={genre.slug} type="checkbox" nom="genre" valeur={genre.slug} coche={criteres.genres.includes(genre.slug)}>
            {genre.nom}
          </Pastille>
        ))}
      </Groupe>
      <Groupe titre={t("Catalogue.statut")}>
        {STATUTS.map((statut) => (
          <Pastille key={statut} type="checkbox" nom="statut" valeur={statut} coche={criteres.statuts.includes(statut)}>
            {t(`Statut.${statut}`)}
          </Pastille>
        ))}
      </Groupe>
      <Groupe titre={t("Catalogue.classification")}>
        {CLASSIFICATIONS.map((classification) => (
          <Pastille key={classification} type="checkbox" nom="classification" valeur={classification} coche={criteres.classifications.includes(classification)}>
            {t(`Classification.${classification}`)}
          </Pastille>
        ))}
      </Groupe>
      <Groupe titre={t("Catalogue.note")}>
        {/* Valeurs sur 10 : 6 = 3 étoiles, 8 = 4 étoiles */}
        {[0, 6, 7, 8, 9].map((note) => (
          <Pastille key={note} type="radio" nom="note" valeur={String(note)} coche={criteres.noteMin === note}>
            {note === 0 ? t("Catalogue.noteToutes") : t("Catalogue.noteMin", { etoiles: `${(note / 2).toLocaleString("fr-FR")} ★` })}
          </Pastille>
        ))}
      </Groupe>

      <div className="sticky bottom-0 flex gap-2 bg-surface py-3 md:static md:bg-transparent md:py-0">
        <Link href="/catalogue" className={classesBouton({ variante: "secondaire" })}>
          {t("Catalogue.effacer")}
        </Link>
        <button type="submit" className={classesBouton({ pleineLargeur: true })}>
          {t("Catalogue.appliquer")}
        </button>
      </div>
    </form>
  );
}
