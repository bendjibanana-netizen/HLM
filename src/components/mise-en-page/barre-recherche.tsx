"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Suggestion = {
  slug: string;
  titre: string;
  type: string;
  auteurs: string[];
  couvertureCle: string | null;
  couleurDominante: string | null;
};

/**
 * Barre de recherche de l'en-tête, avec suggestions pendant la saisie.
 * Reste un simple formulaire GET vers le catalogue : la touche Entrée fonctionne même sans JavaScript.
 */
export function BarreRecherche({ action, className }: { action: string; className?: string }) {
  const t = useTranslations();
  const [requete, setRequete] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [ouverte, setOuverte] = useState(false);
  const conteneur = useRef<HTMLFormElement>(null);

  // Recherche lancée 200 ms après la dernière frappe ; une saisie plus récente annule la précédente.
  useEffect(() => {
    const texte = requete.trim();
    if (texte.length < 2) return;
    const annulation = new AbortController();
    const minuterie = setTimeout(() => {
      fetch(`/api/recherche?q=${encodeURIComponent(texte)}`, { signal: annulation.signal })
        .then((reponse) => reponse.json())
        .then((donnees: { series: Suggestion[] }) => setSuggestions(donnees.series))
        .catch(() => {
          // Requête annulée ou réseau indisponible : on garde les suggestions affichées.
        });
    }, 200);
    return () => {
      clearTimeout(minuterie);
      annulation.abort();
    };
  }, [requete]);

  // Ferme les suggestions au clic à l'extérieur et avec Échap (et au choix d'une suggestion, plus bas).
  useEffect(() => {
    if (!ouverte) return;
    const surClic = (evenement: PointerEvent) => {
      if (!conteneur.current?.contains(evenement.target as Node)) setOuverte(false);
    };
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") setOuverte(false);
    };
    document.addEventListener("pointerdown", surClic);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("pointerdown", surClic);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouverte]);

  const texte = requete.trim();
  const afficher = ouverte && texte.length >= 2 && suggestions !== null;

  return (
    <form ref={conteneur} action={action} method="get" role="search" onSubmit={() => setOuverte(false)} className={cn("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-texte-doux" aria-hidden />
      <input
        type="search"
        name="q"
        value={requete}
        onChange={(evenement) => {
          setRequete(evenement.target.value);
          setOuverte(true);
        }}
        onFocus={() => setOuverte(true)}
        placeholder={t("Navigation.recherchePlaceholder")}
        aria-label={t("Navigation.rechercher")}
        enterKeyHint="search"
        autoComplete="off"
        className="h-10 w-full rounded-full border border-transparent bg-surface-2 pr-4 pl-10 text-texte placeholder:text-texte-doux focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      {afficher && (
        // Sur mobile, le panneau occupe toute la largeur de l'écran sous l'en-tête.
        <div className="fixed inset-x-2 top-[calc(var(--spacing-entete)+0.25rem)] z-50 overflow-hidden rounded-2xl border border-bordure bg-surface shadow-xl md:absolute md:inset-x-auto md:top-12 md:right-0 md:w-96">
          {suggestions.length === 0 ? (
            <p className="p-4 text-sm text-texte-doux">{t("Recherche.aucune")}</p>
          ) : (
            <ul aria-label={t("Recherche.suggestions")}>
              {suggestions.map((serie) => (
                <li key={serie.slug}>
                  <Link
                    href={{ pathname: "/serie/[slug]", params: { slug: serie.slug } }}
                    onClick={() => setOuverte(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-surface-2"
                  >
                    <span className="w-9 shrink-0">
                      <ImageCouverture cle={serie.couvertureCle} couleur={serie.couleurDominante} alt="" sizes="36px" className="rounded-sm" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{serie.titre}</span>
                      <span className="block truncate text-sm text-texte-doux">
                        {t(`Type.${serie.type as "WEBTOON"}`)} · {serie.auteurs.join(", ")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button type="submit" className="block w-full border-t border-bordure px-4 py-3 text-left text-sm font-semibold text-accent hover:bg-surface-2">
            {t("Recherche.toutVoir", { requete: texte })}
          </button>
        </div>
      )}
    </form>
  );
}
