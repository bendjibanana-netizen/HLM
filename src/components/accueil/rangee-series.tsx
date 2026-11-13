import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { CarteSerie, type DonneesCarte } from "@/components/serie/carte-serie";
import { Link } from "@/i18n/navigation";

/** Section de l'accueil : un titre et une rangée de séries à faire défiler du pouce. */
export function RangeeSeries({ titre, series, tri }: { titre: string; series: DonneesCarte[]; tri: "tendances" | "note" | "recent" }) {
  const t = useTranslations("Accueil");
  if (series.length === 0) return null;
  const id = `rangee-${tri}`;

  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">
        <h2 id={id} className="text-xl font-bold">
          {titre}
        </h2>
        <Link
          href={{ pathname: "/catalogue", query: { tri } }}
          className="flex h-10 items-center gap-0.5 text-sm font-semibold text-accent hover:underline"
        >
          {t("toutVoir")}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      {/* scroll-pl : la première carte s'aligne sur la marge de la page quand on relâche */}
      <ul className="sans-barre mx-auto flex w-full max-w-6xl snap-x scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1">
        {series.map((serie) => (
          <li key={serie.slug} className="w-[29vw] max-w-36 shrink-0 snap-start sm:w-36">
            <CarteSerie serie={serie} sizes="(min-width: 640px) 144px, 29vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
