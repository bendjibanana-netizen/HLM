import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

type Taille = "sm" | "md";

const TAILLES: Record<Taille, string> = {
  sm: "size-3.5",
  md: "size-5",
};

/**
 * Affiche une note en étoiles, à la demi-étoile près.
 * `note` est sur 10, comme en base de données : 7 correspond à 3,5 étoiles.
 */
export function Etoiles({
  note,
  libelle,
  taille = "md",
  className,
}: {
  note: number;
  /** Texte lu par les lecteurs d'écran, ex. « 3,5 sur 5 ». */
  libelle: string;
  taille?: Taille;
  className?: string;
}) {
  const pourcentage = Math.max(0, Math.min(10, note)) * 10;
  const rangee = (rempli: boolean) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={cn("shrink-0", TAILLES[taille], rempli && "fill-current")} strokeWidth={rempli ? 0 : 1.5} aria-hidden />
    ));

  return (
    <span className={cn("relative inline-flex", className)} role="img" aria-label={libelle}>
      {/* Rangée de fond : étoiles vides */}
      <span className="flex text-bordure">{rangee(false)}</span>
      {/* Rangée pleine, rognée à la largeur correspondant à la note */}
      <span className="absolute inset-0 flex overflow-hidden text-accent" style={{ width: `${pourcentage}%` }}>
        {rangee(true)}
      </span>
    </span>
  );
}
