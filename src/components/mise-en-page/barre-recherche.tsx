import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/**
 * Barre de recherche de l'en-tête. Simple formulaire GET vers le catalogue :
 * il fonctionne sans JavaScript. La recherche instantanée arrive en phase 2.
 */
export async function BarreRecherche({ className }: { className?: string }) {
  const t = await getTranslations("Navigation");
  const locale = await getLocale();

  return (
    <form
      action={getPathname({ href: "/catalogue", locale })}
      method="get"
      role="search"
      className={cn("relative min-w-0 flex-1", className)}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-texte-doux" aria-hidden />
      <input
        type="search"
        name="q"
        placeholder={t("recherchePlaceholder")}
        aria-label={t("rechercher")}
        enterKeyHint="search"
        autoComplete="off"
        className="h-10 w-full rounded-full border border-transparent bg-surface-2 pr-4 pl-10 text-texte placeholder:text-texte-doux focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </form>
  );
}
