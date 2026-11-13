import { Star } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge, BadgeClassification, type Classification } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { ImageCouverture } from "./image-couverture";

export type DonneesCarte = {
  slug: string;
  titre: string;
  type: string;
  classification: string;
  couvertureCle: string | null;
  couleurDominante: string | null;
  noteMoyenne: number;
  nbNotes: number;
};

/** Carte d'une série : couverture, titre, type et note. Toute la carte est cliquable. */
export function CarteSerie({ serie, sizes, prioritaire }: { serie: DonneesCarte; sizes: string; prioritaire?: boolean }) {
  const t = useTranslations();
  const format = useFormatter();

  return (
    <Link href={{ pathname: "/serie/[slug]", params: { slug: serie.slug } }} className="group flex flex-col gap-1.5 rounded-lg">
      <div className="relative">
        <ImageCouverture
          cle={serie.couvertureCle}
          couleur={serie.couleurDominante}
          alt=""
          sizes={sizes}
          prioritaire={prioritaire}
          className="transition group-hover:brightness-110"
        />
        {/* La classification n'est affichée que si elle restreint le public */}
        {serie.classification !== "TOUT_PUBLIC" && (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-fond/90">
            <BadgeClassification classification={serie.classification as Classification} />
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm leading-tight font-semibold">{serie.titre}</p>
      <p className="flex items-center gap-1.5 text-xs text-texte-doux">
        <Badge className="h-5 px-1.5">{t(`Type.${serie.type as "WEBTOON"}`)}</Badge>
        {serie.nbNotes > 0 && (
          <span className="flex items-center gap-0.5" aria-label={t("Serie.note", { note: format.number(serie.noteMoyenne / 2, { maximumFractionDigits: 1 }) })}>
            <Star className="size-3 fill-accent text-accent" aria-hidden />
            {format.number(serie.noteMoyenne / 2, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
        )}
      </p>
    </Link>
  );
}
