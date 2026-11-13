"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { estActif, LIENS_PRINCIPAUX } from "./liens";

/** Liens de l'en-tête, visibles à partir de la tablette (le mobile utilise la navigation basse). */
export function LiensEntete() {
  const t = useTranslations("Navigation");
  const cheminCourant = usePathname();

  return (
    <ul className="hidden items-center gap-1 md:flex">
      {/* « Compte » est déjà représenté par l'avatar à droite de l'en-tête */}
      {LIENS_PRINCIPAUX.filter(({ cle }) => cle !== "compte").map(({ chemin, cle }) => {
        const actif = estActif(cheminCourant, chemin);
        return (
          <li key={chemin}>
            <Link
              href={chemin}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition",
                actif ? "text-texte" : "text-texte-doux hover:text-texte",
              )}
            >
              {t(cle)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
