"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { Segments } from "@/components/ui/segments";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Bascule l'interface entre le français et l'anglais en restant sur la même page. */
export function SelecteurLangue() {
  const t = useTranslations("Langue");
  const locale = useLocale() as Locale;
  const cheminCourant = usePathname();
  const parametres = useParams();
  const routeur = useRouter();
  const [, demarrerTransition] = useTransition();

  return (
    <Segments
      libelle={t("libelle")}
      valeur={locale}
      onChange={(nouvelle) =>
        demarrerTransition(() =>
          routeur.replace(
            // @ts-expect-error -- le chemin courant et ses paramètres (slug, numéro) vont toujours ensemble,
            // ce que TypeScript ne peut pas déduire.
            { pathname: cheminCourant, params: parametres },
            { locale: nouvelle },
          ),
        )
      }
      options={[
        { valeur: "fr", libelle: t("fr") },
        { valeur: "en", libelle: t("en") },
      ]}
    />
  );
}
