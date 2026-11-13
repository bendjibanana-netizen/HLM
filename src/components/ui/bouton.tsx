import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

type Variante = "primaire" | "secondaire" | "discret" | "danger";
type Taille = "sm" | "md" | "lg";

type Options = {
  variante?: Variante;
  taille?: Taille;
  /** Occupe toute la largeur disponible (formulaires sur mobile). */
  pleineLargeur?: boolean;
};

const VARIANTES: Record<Variante, string> = {
  primaire: "bg-accent text-sur-accent hover:brightness-110 active:brightness-95",
  secondaire: "border border-bordure bg-surface text-texte hover:bg-surface-2 active:bg-surface-2",
  discret: "text-texte hover:bg-surface-2 active:bg-surface-2",
  danger: "border border-danger/40 text-danger hover:bg-danger/10 active:bg-danger/10",
};

// La taille « md » fait 44 px de haut : la cible tactile minimale recommandée sur mobile.
const TAILLES: Record<Taille, string> = {
  sm: "h-10 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-6 text-base",
};

/** Classes communes aux boutons et aux liens qui en ont l'apparence. */
export function classesBouton({ variante = "primaire", taille = "md", pleineLargeur = false }: Options = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-xl font-semibold transition",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTES[variante],
    TAILLES[taille],
    pleineLargeur && "w-full",
  );
}

type ProprietesBouton = ButtonHTMLAttributes<HTMLButtonElement> &
  Options & {
    /** Affiche un indicateur de chargement et bloque les clics pendant une action. */
    enCours?: boolean;
  };

export function Bouton({
  variante,
  taille,
  pleineLargeur,
  enCours = false,
  className,
  children,
  disabled,
  type = "button",
  ...proprietes
}: ProprietesBouton) {
  return (
    <button
      type={type}
      className={cn(classesBouton({ variante, taille, pleineLargeur }), className)}
      disabled={disabled || enCours}
      aria-busy={enCours || undefined}
      {...proprietes}
    >
      {enCours && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Lien interne ayant l'apparence d'un bouton. */
export function LienBouton({
  variante,
  taille,
  pleineLargeur,
  className,
  ...proprietes
}: ComponentProps<typeof Link> & Options) {
  return <Link className={cn(classesBouton({ variante, taille, pleineLargeur }), className)} {...proprietes} />;
}
