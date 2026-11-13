import { getFormatter, getTranslations } from "next-intl/server";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Link } from "@/i18n/navigation";

type Sortie = {
  id: string;
  numero: { toString(): string };
  publieLe: Date | null;
  serie: { slug: string; titre: string; type: string; couvertureCle: string | null; couleurDominante: string | null };
};

const FUSEAU = "Europe/Paris";

/** Jour calendaire (AAAA-MM-JJ) d'une date dans le fuseau du site. */
function jour(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: FUSEAU }).format(date);
}

/** Chapitres sortis ces 7 derniers jours, regroupés par jour. */
export async function SortiesSemaine({ sorties }: { sorties: Sortie[] }) {
  const t = await getTranslations();
  const format = await getFormatter();
  if (sorties.length === 0) return null;

  const maintenant = new Date();
  const aujourdhui = jour(maintenant);
  const hier = jour(new Date(maintenant.getTime() - 24 * 60 * 60 * 1000));

  // Les sorties arrivent triées de la plus récente à la plus ancienne : l'ordre des jours est conservé.
  const parJour = new Map<string, Sortie[]>();
  for (const sortie of sorties) {
    if (!sortie.publieLe) continue;
    const cle = jour(sortie.publieLe);
    parJour.set(cle, [...(parJour.get(cle) ?? []), sortie]);
  }

  const libelle = (cle: string, date: Date) => {
    if (cle === aujourdhui) return t("Accueil.aujourdhui");
    if (cle === hier) return t("Accueil.hier");
    const texte = format.dateTime(date, { weekday: "long", day: "numeric", month: "long", timeZone: FUSEAU });
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  };

  return (
    <section aria-labelledby="titre-sorties" className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4">
      <h2 id="titre-sorties" className="text-xl font-bold">
        {t("Accueil.sorties")}
      </h2>
      {[...parJour.entries()].map(([cle, duJour]) => (
        <div key={cle} className="flex flex-col gap-2">
          <h3 className="text-sm font-bold tracking-wide text-texte-doux uppercase">{libelle(cle, duJour[0]!.publieLe!)}</h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {duJour.map((sortie) => (
              <li key={sortie.id}>
                <Link
                  href={{ pathname: "/lire/[slug]/[numero]", params: { slug: sortie.serie.slug, numero: sortie.numero.toString() } }}
                  className="flex items-center gap-3 rounded-xl border border-bordure bg-surface p-2 transition hover:bg-surface-2"
                >
                  <span className="w-11 shrink-0">
                    <ImageCouverture cle={sortie.serie.couvertureCle} couleur={sortie.serie.couleurDominante} alt="" sizes="44px" className="rounded-md" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{sortie.serie.titre}</span>
                    <span className="block text-sm text-texte-doux">
                      {t("Serie.chapitre", { numero: sortie.numero.toString() })} · {t(`Type.${sortie.serie.type as "WEBTOON"}`)}
                    </span>
                  </span>
                  <time dateTime={sortie.publieLe!.toISOString()} className="shrink-0 text-xs text-texte-doux">
                    {format.dateTime(sortie.publieLe!, { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
