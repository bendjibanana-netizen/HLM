"use client";

import { ArrowDownUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";

type Chapitre = { id: string; numero: string; titre: string | null; publieLe: string | null };

/** Liste des chapitres d'une série, du plus récent au plus ancien par défaut, avec inversion de l'ordre. */
export function ListeChapitres({ slug, chapitres }: { slug: string; chapitres: Chapitre[] }) {
  const t = useTranslations("Serie");
  const format = useFormatter();
  const [recentDAbord, setRecentDAbord] = useState(true);
  const ordonnes = recentDAbord ? chapitres : [...chapitres].reverse();

  return (
    <section aria-labelledby="titre-chapitres" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id="titre-chapitres" className="text-xl font-bold">
          {t("listeChapitres")} <span className="text-base font-semibold text-texte-doux">({chapitres.length})</span>
        </h2>
        {chapitres.length > 1 && (
          <button
            type="button"
            onClick={() => setRecentDAbord((valeur) => !valeur)}
            className="flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-texte-doux hover:text-texte"
          >
            <ArrowDownUp className="size-4" aria-hidden />
            {recentDAbord ? t("ordreRecent") : t("ordreAncien")}
          </button>
        )}
      </div>
      {chapitres.length === 0 ? (
        <p className="text-texte-doux">{t("aucunChapitre")}</p>
      ) : (
        <ul className="divide-y divide-bordure overflow-hidden rounded-2xl border border-bordure bg-surface">
          {ordonnes.map((chapitre) => (
            <li key={chapitre.id}>
              <Link
                href={{ pathname: "/lire/[slug]/[numero]", params: { slug, numero: chapitre.numero } }}
                className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 transition hover:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{t("chapitre", { numero: chapitre.numero })}</span>
                  {chapitre.titre && <span className="block truncate text-sm text-texte-doux">{chapitre.titre}</span>}
                </span>
                {chapitre.publieLe && (
                  <time dateTime={chapitre.publieLe} className="shrink-0 text-sm text-texte-doux">
                    {format.dateTime(new Date(chapitre.publieLe), { dateStyle: "medium", timeZone: "Europe/Paris" })}
                  </time>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
