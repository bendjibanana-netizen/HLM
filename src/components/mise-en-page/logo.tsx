import { cn } from "@/lib/cn";
import { NOM_SITE } from "@/lib/site";

/**
 * Emblème du site : une planche découpée en trois cases, façon tampon.
 * Le nom est masqué sur mobile dans l'en-tête pour laisser la place à la recherche.
 */
export function Logo({ avecNom = true, className }: { avecNom?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-accent" />
        {/* Trois cases séparées par des gouttières, dont une en biais */}
        <g className="fill-sur-accent">
          <path d="M7 7h8.2l-1.6 8H7z" />
          <path d="M17.6 7H25v8h-9z" />
          <path d="M7 17.4h18V25H7z" />
        </g>
      </svg>
      {avecNom && <span className="font-titre text-lg font-extrabold tracking-tight">{NOM_SITE}</span>}
    </span>
  );
}
