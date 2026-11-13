import { useFormatter, useTranslations } from "next-intl";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Avatar } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import type { ActiviteAffichee } from "@/server/communaute";

/** Liste d'événements d'activité : « Camille a noté Café Minuit », etc. */
export function Fil({ activites, vide }: { activites: ActiviteAffichee[]; vide: string }) {
  const t = useTranslations("Communaute.activite");
  const format = useFormatter();
  if (activites.length === 0) return <p className="text-texte-doux">{vide}</p>;

  return (
    <ul className="flex flex-col gap-2">
      {activites.map((activite) => {
        const texte = t.rich(activite.type, {
          nom: () => (
            <Link href={{ pathname: "/u/[pseudo]", params: { pseudo: activite.user.pseudo } }} className="font-semibold hover:underline">
              {activite.user.name}
            </Link>
          ),
          serie: () =>
            activite.serie ? (
              <Link href={{ pathname: "/serie/[slug]", params: { slug: activite.serie.slug } }} className="font-semibold hover:underline">
                {activite.serie.titre}
              </Link>
            ) : null,
          cible: () =>
            activite.cibleUser ? (
              <Link href={{ pathname: "/u/[pseudo]", params: { pseudo: activite.cibleUser.pseudo } }} className="font-semibold hover:underline">
                {activite.cibleUser.name}
              </Link>
            ) : null,
          liste: activite.liste?.nom ?? "",
          numero: activite.chapitre?.numero ?? "",
        });
        const note = activite.type === "NOTE" ? (activite.donnees as { valeur?: number } | null)?.valeur : undefined;
        return (
          <li key={activite.id} className="flex items-center gap-3 rounded-xl border border-bordure bg-surface p-2.5">
            <Avatar nom={activite.user.name} image={activite.user.image} taille="sm" />
            <p className="min-w-0 flex-1 text-sm">
              {texte}
              {note ? <span className="font-semibold text-accent"> · {(note / 2).toLocaleString("fr-FR")} ★</span> : null}
              <time dateTime={activite.creeLe} className="block text-xs text-texte-doux">
                {format.relativeTime(new Date(activite.creeLe))}
              </time>
            </p>
            {activite.serie && (
              <span className="w-9 shrink-0">
                <ImageCouverture cle={activite.serie.couvertureCle} couleur={activite.serie.couleurDominante} alt="" sizes="36px" className="rounded-sm" />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
