import { cn } from "@/lib/cn";

type Taille = "sm" | "md" | "lg";

const TAILLES: Record<Taille, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
};

/** Initiales affichées quand le compte n'a pas d'image : deux lettres au plus. */
function initiales(nom: string): string {
  const mots = nom.trim().split(/[\s_]+/).filter(Boolean);
  const lettres = mots.length >= 2 ? `${mots[0]![0]}${mots[1]![0]}` : (mots[0] ?? "?").slice(0, 2);
  return lettres.toUpperCase();
}

/** Portrait rond d'un compte : son image, ou ses initiales à défaut. */
export function Avatar({
  nom,
  image,
  taille = "md",
  className,
}: {
  nom: string;
  image?: string | null;
  taille?: Taille;
  className?: string;
}) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-bold text-texte-doux",
    TAILLES[taille],
    className,
  );

  if (image) {
    // Image distante (Google, Discord) de petite taille : pas d'optimisation Next nécessaire.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={cn(classes, "object-cover")} referrerPolicy="no-referrer" />;
  }

  return (
    <span className={classes} aria-hidden>
      {initiales(nom)}
    </span>
  );
}
