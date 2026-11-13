import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { classesBouton } from "@/components/ui/bouton";
import { Link } from "@/i18n/navigation";
import { cleVariante, srcset, urlImage, variantesFixes } from "@/lib/images/variantes";

type Vedette = {
  id: string;
  accroche: string | null;
  serie: { slug: string; titre: string; type: string; banniereCle: string | null; couleurDominante: string | null };
};

/**
 * Carrousel des séries mises en avant. Défilement natif avec aimantation :
 * fluide au doigt, sans JavaScript, et la carte suivante dépasse pour inviter à glisser.
 */
export function Carrousel({ vedettes }: { vedettes: Vedette[] }) {
  const t = useTranslations();
  if (vedettes.length === 0) return null;

  return (
    <section aria-label={t("Accueil.aLaUne")}>
      <ul className="sans-barre mx-auto flex w-full max-w-6xl snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4">
        {vedettes.map(({ id, accroche, serie }, index) => {
          const variantes = serie.banniereCle ? variantesFixes(serie.banniereCle, "banniere") : [];
          const sizes = "(min-width: 768px) 720px, 86vw";
          return (
            <li key={id} className="w-[86vw] max-w-180 shrink-0 snap-start">
              <Link
                href={{ pathname: "/serie/[slug]", params: { slug: serie.slug } }}
                className="relative flex aspect-4/3 flex-col justify-end overflow-hidden rounded-2xl bg-surface-2 sm:aspect-2/1"
                style={serie.couleurDominante ? { backgroundColor: serie.couleurDominante } : undefined}
              >
                {serie.banniereCle && (
                  <picture>
                    <source type="image/avif" srcSet={srcset(variantes, "avif")} sizes={sizes} />
                    <source type="image/webp" srcSet={srcset(variantes, "webp")} sizes={sizes} />
                    { }
                    <img
                      src={urlImage(cleVariante(serie.banniereCle, 640, "webp"))}
                      alt=""
                      width={1280}
                      height={640}
                      // La première bannière est l'élément le plus visible de la page : chargée en priorité.
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : undefined}
                      decoding="async"
                      className="absolute inset-0 size-full object-cover"
                    />
                  </picture>
                )}
                {/* Dégradé sombre : le texte reste lisible quelle que soit l'image */}
                <span className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" aria-hidden />
                <span className="relative flex flex-col items-start gap-2 p-4 text-white sm:p-6">
                  <Badge className="bg-white/20 text-white">{t(`Type.${serie.type as "WEBTOON"}`)}</Badge>
                  <span className="font-titre text-2xl leading-tight font-extrabold sm:text-4xl">{serie.titre}</span>
                  {accroche && <span className="text-sm text-white/85 sm:text-base">{accroche}</span>}
                  <span className={classesBouton({ taille: "sm" })}>{t("Accueil.lire")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
