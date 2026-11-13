import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Message affiché à la place d'un contenu absent : liste vide, page à venir, aucun résultat. */
export function EtatVide({
  icone: Icone,
  titre,
  children,
  action,
}: {
  icone: LucideIcon;
  titre: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-texte-doux">
        <Icone className="size-7" aria-hidden />
      </span>
      <h1 className="text-xl font-bold">{titre}</h1>
      {children && <p className="text-texte-doux">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
