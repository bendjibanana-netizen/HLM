import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { BoutonBascule } from "@/components/communaute/bouton-bascule";
import { Fil } from "@/components/communaute/fil";
import { Signalement } from "@/components/communaute/signalement";
import { VignetteListe } from "@/components/communaute/vignette-liste";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Avatar } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { obtenirSession } from "@/lib/session";
import { suivreUtilisateur } from "@/server/actions/communaute";
import { activiteDe, journalDe, listesDe, profilPublic } from "@/server/communaute";

export async function generateMetadata({ params }: PageProps<"/[locale]/u/[pseudo]">): Promise<Metadata> {
  const { pseudo } = await params;
  const profil = await profilPublic(pseudo);
  return profil ? { title: `${profil.name} (@${profil.pseudo})`, description: profil.bio ?? undefined } : {};
}

export default async function PageProfil({ params }: PageProps<"/[locale]/u/[pseudo]">) {
  const { pseudo } = await params;
  const session = await obtenirSession();
  const profil = await profilPublic(pseudo, session?.user.id);
  if (!profil) notFound();

  const t = await getTranslations("Communaute");
  const format = await getFormatter();
  const [listes, activites, journal] = await Promise.all([listesDe(profil.id, profil.aMoi), activiteDe(profil.id), journalDe(profil.id, 12)]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Avatar nom={profil.name} image={profil.image} taille="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold">{profil.name}</h1>
            <p className="truncate text-texte-doux">@{profil.pseudo}</p>
          </div>
          {session && !profil.aMoi && <BoutonBascule actif={profil.suivi} action={suivreUtilisateur.bind(null, profil.pseudo)} libelleActif={t("profil.neplusSuivre")} libelleInactif={t("profil.suivre")} />}
        </div>
        {profil.bio && <p className="whitespace-pre-line">{profil.bio}</p>}
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texte-doux">
          <span>{t("profil.abonnes", { nombre: profil._count.abonnes })}</span>
          <span>{t("profil.abonnements", { nombre: profil._count.abonnements })}</span>
          <span>{t("profil.notes", { nombre: profil._count.notes })}</span>
          <span>{t("profil.lectures", { nombre: profil._count.journal })}</span>
        </p>
        <p className="text-sm text-texte-doux">{t("profil.membreDepuis", { date: format.dateTime(profil.createdAt, { month: "long", year: "numeric" }) })}</p>
      </header>

      {listes.length > 0 && (
        <section aria-labelledby="titre-listes" className="flex flex-col gap-3">
          <h2 id="titre-listes" className="text-xl font-bold">{t("profil.listes")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {listes.map((liste) => (
              <li key={liste.id}>
                <VignetteListe pseudo={profil.pseudo} liste={liste} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="titre-journal" className="flex flex-col gap-3">
        <h2 id="titre-journal" className="text-xl font-bold">{t("profil.journal")}</h2>
        {journal.length === 0 ? (
          <p className="text-texte-doux">{t("profil.journalVide")}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {journal.map((entree) => (
              <li key={entree.id}>
                <Link href={{ pathname: "/serie/[slug]", params: { slug: entree.serie.slug } }} className="flex items-center gap-3 rounded-xl border border-bordure bg-surface p-2 hover:bg-surface-2">
                  <span className="w-9 shrink-0">
                    <ImageCouverture cle={entree.serie.couvertureCle} couleur={entree.serie.couleurDominante} alt="" sizes="36px" className="rounded-sm" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{entree.serie.titre}</span>
                    <span className="text-xs text-texte-doux">
                      {entree.numero} · <time dateTime={entree.luLe}>{format.dateTime(new Date(entree.luLe), { dateStyle: "medium" })}</time>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titre-activite" className="flex flex-col gap-3">
        <h2 id="titre-activite" className="text-xl font-bold">{t("profil.activite")}</h2>
        <Fil activites={activites} vide={t("profil.aucuneActivite")} />
      </section>

      {!profil.aMoi && (
        <div className="flex justify-end border-t border-bordure pt-2">
          <Signalement cible="UTILISATEUR" id={profil.id} />
        </div>
      )}
    </div>
  );
}
