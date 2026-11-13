import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Link } from "@/i18n/navigation";

type Liste = {
  slug: string; nom: string; type: string; publique: boolean;
  _count: { elements: number };
  elements: { serie: { couvertureCle: string | null; couleurDominante: string | null } }[];
};

/** Carte d'une liste : trois couvertures superposées, son nom et le nombre de séries. */
export function VignetteListe({ pseudo, liste }: { pseudo: string; liste: Liste }) {
  const t = useTranslations("Communaute");
  const nom = liste.type === "LIBRE" ? liste.nom : t(`statuts.${liste.type as "A_LIRE"}`);
  return (
    <Link href={{ pathname: "/u/[pseudo]/liste/[slug]", params: { pseudo, slug: liste.slug } }} className="flex items-center gap-3 rounded-xl border border-bordure bg-surface p-2.5 hover:bg-surface-2">
      <span className="flex w-20 shrink-0 -space-x-6">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-10 shrink-0 rounded-md shadow-sm" style={{ zIndex: 3 - i }}>
            <ImageCouverture cle={liste.elements[i]?.serie.couvertureCle ?? null} couleur={liste.elements[i]?.serie.couleurDominante} alt="" sizes="40px" className="rounded-md" />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="truncate">{nom}</span>
          {!liste.publique && <Lock className="size-3.5 shrink-0 text-texte-doux" aria-label={t("listePrivee")} />}
        </span>
        <span className="text-sm text-texte-doux">{t("series", { nombre: liste._count.elements })}</span>
      </span>
    </Link>
  );
}
