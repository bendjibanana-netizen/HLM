import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Avertissement16 } from "@/components/serie/avertissement-16";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { ListeChapitres } from "@/components/serie/liste-chapitres";
import { Badge, BadgeClassification } from "@/components/ui/badge";
import { LienBouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { Etoiles } from "@/components/ui/etoiles";
import { Link } from "@/i18n/navigation";
import { cleVariante, urlImage } from "@/lib/images/variantes";
import { obtenirSession } from "@/lib/session";
import { peutPrevisualiser } from "@/server/acces";
import { ActionsSerie } from "@/components/communaute/actions-serie";
import { Critiques } from "@/components/communaute/critiques";
import { Signalement } from "@/components/communaute/signalement";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { critiquesDeLaSerie, etatLecteur } from "@/server/communaute";
import { serieParSlug } from "@/server/catalogue";

export async function generateMetadata({ params }: PageProps<"/[locale]/serie/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const serie = await serieParSlug(slug);
  if (!serie) return {};
  const description = serie.synopsis.length > 160 ? `${serie.synopsis.slice(0, 157)}…` : serie.synopsis;
  return {
    title: serie.titre,
    description,
    openGraph: {
      title: serie.titre,
      description,
      images: serie.couvertureCle ? [urlImage(cleVariante(serie.couvertureCle, 720, "webp"))] : undefined,
    },
  };
}

export default async function PageSerie({ params }: PageProps<"/[locale]/serie/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // L'équipe de la série et la modération voient la fiche avant sa publication.
  const serie = await serieParSlug(slug, await peutPrevisualiser(slug));
  if (!serie) notFound();
  const enApercu = serie.statutModeration !== "PUBLIEE";

  const t = await getTranslations();
  const format = await getFormatter();
  const session = await obtenirSession();

  const chapitres = serie.chapitres.map((chapitre) => ({
    id: chapitre.id,
    numero: chapitre.numero.toString(),
    titre: chapitre.titre,
    publieLe: chapitre.publieLe?.toISOString() ?? null,
  }));
  const premier = chapitres.at(-1);
  const dernier = chapitres[0];
  // Les visiteurs ne lisent que les séries tout public ; les autres demandent un compte.
  const compteRequis = serie.classification !== "TOUT_PUBLIC" && !session;
  const etat = session ? await etatLecteur(session.user.id, serie.id) : null;
  const critiques = await critiquesDeLaSerie(serie.id, session?.user.id);
  const noteSur5 = format.number(serie.noteMoyenne / 2, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const infos: { libelle: string; valeur: ReactNode }[] = [
    { libelle: t("Serie.auteurs"), valeur: serie.auteurs.map(({ auteur }) => auteur.nom).join(", ") },
    { libelle: t("Serie.equipe"), valeur: serie.equipe.nom },
    { libelle: t("Serie.langue"), valeur: t(`LangueSerie.${serie.langue}`) },
    { libelle: t("Serie.statut"), valeur: t(`Statut.${serie.statut}`) },
    ...(serie.anneeParution ? [{ libelle: t("Serie.annee"), valeur: String(serie.anneeParution) }] : []),
    ...(serie.titresAlternatifs.length ? [{ libelle: t("Serie.titresAlternatifs"), valeur: serie.titresAlternatifs.join(" · ") }] : []),
  ];

  const contenu = (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-5">
      {enApercu && <Message>{t("Equipe.apercuBandeau")}</Message>}
      <header className="flex gap-4">
        <div className="w-28 shrink-0 sm:w-44">
          <ImageCouverture
            cle={serie.couvertureCle}
            couleur={serie.couleurDominante}
            alt={t("Serie.couverture", { titre: serie.titre })}
            sizes="(min-width: 640px) 176px, 112px"
            prioritaire
            className="rounded-xl"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl leading-tight font-extrabold sm:text-4xl">{serie.titre}</h1>
          <p className="text-texte-doux">{serie.auteurs.map(({ auteur }) => auteur.nom).join(", ")}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{t(`Type.${serie.type}`)}</Badge>
            <Badge ton={serie.statut === "TERMINE" ? "succes" : serie.statut === "EN_COURS" ? "accent" : "alerte"}>
              {t(`Statut.${serie.statut}`)}
            </Badge>
            <BadgeClassification classification={serie.classification} />
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {serie.nbNotes > 0 ? (
              <>
                <Etoiles note={serie.noteMoyenne} libelle={t("Serie.note", { note: noteSur5 })} />
                <span className="font-bold tabular-nums">{noteSur5}</span>
                <span className="text-texte-doux">{t("Serie.notes", { nombre: serie.nbNotes })}</span>
              </>
            ) : (
              <span className="text-texte-doux">{t("Serie.pasDeNote")}</span>
            )}
          </div>
        </div>
      </header>

      {premier && dernier && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <LienBouton href={{ pathname: "/lire/[slug]/[numero]", params: { slug, numero: premier.numero } }} taille="lg" pleineLargeur>
            {t("Serie.commencer")}
          </LienBouton>
          {dernier.numero !== premier.numero && (
            <LienBouton
              href={{ pathname: "/lire/[slug]/[numero]", params: { slug, numero: dernier.numero } }}
              taille="lg"
              variante="secondaire"
              pleineLargeur
            >
              {t("Serie.dernier")} · {dernier.numero}
            </LienBouton>
          )}
        </div>
      )}
      {compteRequis && (
        <p className="flex items-center gap-2 text-sm text-texte-doux">
          <Lock className="size-4 shrink-0" aria-hidden />
          {t("Serie.compteRequis")}
        </p>
      )}
      {!enApercu && (
        <ActionsSerie
          serieId={serie.id}
          connecte={Boolean(session)}
          initial={{ note: etat?.note ?? null, suivi: etat?.suivi ?? false, statut: etat?.statut ?? null, listes: etat?.listes ?? [] }}
          suiteConnexion={getPathname({ href: { pathname: "/serie/[slug]", params: { slug } }, locale: locale as Locale })}
        />
      )}

      <section aria-labelledby="titre-synopsis" className="flex flex-col gap-2">
        <h2 id="titre-synopsis" className="text-xl font-bold">
          {t("Serie.synopsis")}
        </h2>
        <p className="leading-relaxed whitespace-pre-line">{serie.synopsis}</p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {serie.genres.map(({ genre }) => (
            <li key={genre.slug}>
              <Link
                href={{ pathname: "/catalogue", query: { genre: genre.slug } }}
                className="inline-flex h-8 items-center rounded-full border border-bordure px-3 text-sm font-semibold hover:bg-surface-2"
              >
                {locale === "en" ? genre.nomEn : genre.nomFr}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <dl className="grid gap-x-6 gap-y-2 rounded-2xl border border-bordure bg-surface p-4 text-sm sm:grid-cols-2">
        {infos.map(({ libelle, valeur }) => (
          <div key={libelle} className="flex justify-between gap-4 sm:flex-col sm:justify-start sm:gap-0.5">
            <dt className="shrink-0 text-texte-doux">{libelle}</dt>
            <dd className="text-right font-semibold sm:text-left">{valeur}</dd>
          </div>
        ))}
      </dl>

      <ListeChapitres slug={slug} chapitres={chapitres} />
      {!enApercu && (
        <>
          <Critiques serieId={serie.id} critiques={critiques} maCritique={etat?.critique ?? null} connecte={Boolean(session)} />
          <div className="flex justify-end border-t border-bordure pt-2">
            <Signalement cible="SERIE" id={serie.id} />
          </div>
        </>
      )}
    </article>
  );

  return serie.classification === "SEIZE_PLUS" ? <Avertissement16>{contenu}</Avertissement16> : contenu;
}
