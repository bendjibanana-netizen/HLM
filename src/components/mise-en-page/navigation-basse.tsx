"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { estActif, LIENS_PRINCIPAUX } from "./liens";

/** Barre d'onglets fixée en bas de l'écran sur mobile : tout est atteignable au pouce. */
export function NavigationBasse() {
  const t = useTranslations("Navigation");
  const cheminCourant = usePathname();

  return (
    <nav
      aria-label={t("principale")}
      className="pb-securite fixed inset-x-0 bottom-0 z-40 border-t border-bordure bg-fond/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-nav max-w-md grid-cols-4">
        {LIENS_PRINCIPAUX.map(({ chemin, cle, icone: Icone }) => {
          const actif = estActif(cheminCourant, chemin);
          return (
            <li key={chemin}>
              <Link
                href={chemin}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition",
                  actif ? "text-texte" : "text-texte-doux active:text-texte",
                )}
              >
                {/* Pastille derrière l'icône de l'onglet actif */}
                <span
                  className={cn(
                    "flex h-7 w-14 items-center justify-center rounded-full transition",
                    actif && "bg-accent text-sur-accent",
                  )}
                >
                  <Icone className="size-5" strokeWidth={actif ? 2.4 : 2} aria-hidden />
                </span>
                {t(cle)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
