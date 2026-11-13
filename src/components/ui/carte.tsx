import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Bloc de contenu sur fond « surface », avec bordure fine. */
export function Carte({ className, ...proprietes }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-bordure bg-surface p-4 sm:p-5", className)} {...proprietes} />;
}
