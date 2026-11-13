import { useTranslations } from "next-intl";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Ton = "neutre" | "accent" | "succes" | "alerte" | "danger";

const TONS: Record<Ton, string> = {
  neutre: "bg-surface-2 text-texte-doux",
  accent: "bg-accent/12 text-accent",
  succes: "bg-succes/12 text-succes",
  alerte: "bg-alerte/14 text-alerte",
  danger: "bg-danger/12 text-danger",
};

/** Petite étiquette : type de série, statut, classification… */
export function Badge({ ton = "neutre", className, ...proprietes }: HTMLAttributes<HTMLSpanElement> & { ton?: Ton }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold whitespace-nowrap",
        TONS[ton],
        className,
      )}
      {...proprietes}
    />
  );
}

export type Classification = "TOUT_PUBLIC" | "DOUZE_PLUS" | "SEIZE_PLUS";

const TON_CLASSIFICATION: Record<Classification, Ton> = {
  TOUT_PUBLIC: "succes",
  DOUZE_PLUS: "alerte",
  SEIZE_PLUS: "danger",
};

/** Classification d'âge d'une série (tout public, 12+, 16+). */
export function BadgeClassification({ classification }: { classification: Classification }) {
  const t = useTranslations("Classification");
  return <Badge ton={TON_CLASSIFICATION[classification]}>{t(classification)}</Badge>;
}
