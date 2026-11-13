"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

type Lecture = {
  slug: string;
  titre: string;
  couvertureCle: string | null;
  couleurDominante: string | null;
  numero: string;
  /** Avancement dans le chapitre, entre 0 et 1. */
  avancement: number;
};

/**
 * « Reprendre ma lecture » : visible uniquement pour un compte connecté ayant des lectures en cours.
 * Chargée côté navigateur pour que l'accueil reste identique, donc rapide, pour tous les visiteurs.
 */
export function ReprendreLecture() {
  const t = useTranslations("Accueil");
  const { data: session } = authClient.useSession();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const connecte = Boolean(session);

  useEffect(() => {
    if (!connecte) return;
    let annule = false;
    fetch("/api/progression")
      .then((reponse) => (reponse.ok ? reponse.json() : { lectures: [] }))
      .then((donnees: { lectures: Lecture[] }) => {
        if (!annule) setLectures(donnees.lectures);
      })
      .catch(() => {
        // Section facultative : en cas d'échec réseau, elle reste simplement masquée.
      });
    return () => {
      annule = true;
    };
  }, [connecte]);

  if (!connecte || lectures.length === 0) return null;

  return (
    <section aria-labelledby="titre-reprendre" className="flex flex-col gap-3">
      <h2 id="titre-reprendre" className="mx-auto w-full max-w-6xl px-4 text-xl font-bold">
        {t("reprendre")}
      </h2>
      <ul className="sans-barre mx-auto flex w-full max-w-6xl snap-x scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1">
        {lectures.map((lecture) => (
          <li key={lecture.slug} className="w-64 shrink-0 snap-start">
            <Link
              href={{ pathname: "/lire/[slug]/[numero]", params: { slug: lecture.slug, numero: lecture.numero } }}
              className="flex items-center gap-3 rounded-xl border border-bordure bg-surface p-2 transition hover:bg-surface-2"
            >
              <span className="w-12 shrink-0">
                <ImageCouverture cle={lecture.couvertureCle} couleur={lecture.couleurDominante} alt="" sizes="48px" className="rounded-md" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-semibold">{lecture.titre}</span>
                <span className="text-sm text-texte-doux">{t("reprendreChapitre", { numero: lecture.numero })}</span>
                {/* Barre d'avancement dans le chapitre */}
                <span className="h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(lecture.avancement * 100)}%` }} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
