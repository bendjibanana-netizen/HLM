import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Ton = "info" | "succes" | "erreur";

const TONS: Record<Ton, { classes: string; icone: typeof Info }> = {
  info: { classes: "border-bordure bg-surface-2 text-texte", icone: Info },
  succes: { classes: "border-succes/30 bg-succes/10 text-texte", icone: CircleCheck },
  erreur: { classes: "border-danger/30 bg-danger/10 text-texte", icone: CircleAlert },
};

const COULEUR_ICONE: Record<Ton, string> = {
  info: "text-texte-doux",
  succes: "text-succes",
  erreur: "text-danger",
};

/** Message en ligne : confirmation, information ou erreur d'un formulaire. */
export function Message({ ton = "info", children, className }: { ton?: Ton; children: ReactNode; className?: string }) {
  const { classes, icone: Icone } = TONS[ton];
  return (
    <div
      // Les erreurs sont annoncées immédiatement par les lecteurs d'écran, le reste poliment.
      role={ton === "erreur" ? "alert" : "status"}
      className={cn("flex gap-2.5 rounded-xl border p-3 text-sm leading-snug", classes, className)}
    >
      <Icone className={cn("mt-px size-4.5 shrink-0", COULEUR_ICONE[ton])} aria-hidden />
      <div>{children}</div>
    </div>
  );
}
