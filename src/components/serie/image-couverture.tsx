import { cn } from "@/lib/cn";
import { cleVariante, srcset, urlImage, variantesFixes } from "@/lib/images/variantes";

/**
 * Couverture d'une série (rapport 2:3). Le navigateur choisit le format (AVIF, sinon WebP)
 * et la largeur adaptés ; la couleur dominante occupe la place pendant le chargement.
 */
export function ImageCouverture({
  cle,
  couleur,
  alt,
  sizes,
  prioritaire = false,
  className,
}: {
  cle: string | null;
  couleur?: string | null;
  alt: string;
  /** Largeur affichée, au format de l'attribut HTML `sizes` (ex. « 30vw »). */
  sizes: string;
  /** Image visible dès l'ouverture de la page : chargée immédiatement. */
  prioritaire?: boolean;
  className?: string;
}) {
  const classes = cn("aspect-2/3 w-full rounded-lg bg-surface-2 object-cover", className);
  if (!cle) return <div className={classes} role="img" aria-label={alt} />;

  const variantes = variantesFixes(cle, "couverture");
  return (
    <picture>
      <source type="image/avif" srcSet={srcset(variantes, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(variantes, "webp")} sizes={sizes} />
      { }
      <img
        src={urlImage(cleVariante(cle, 480, "webp"))}
        alt={alt}
        width={480}
        height={720}
        loading={prioritaire ? "eager" : "lazy"}
        fetchPriority={prioritaire ? "high" : undefined}
        decoding="async"
        className={classes}
        style={couleur ? { backgroundColor: couleur } : undefined}
      />
    </picture>
  );
}
