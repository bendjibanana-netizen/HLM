import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Forme grise animée qui occupe la place d'un contenu en cours de chargement. */
export function Squelette({ className, ...proprietes }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} aria-hidden {...proprietes} />;
}
