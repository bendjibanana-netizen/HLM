import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Actualisation } from "@/components/equipe/actualisation";
import { BoutonAction } from "@/components/equipe/bouton-action";
import { EnvoiFichier } from "@/components/equipe/envoi-fichier";
import { FormulaireSerie } from "@/components/equipe/formulaire-serie";
import { ImageCouverture } from "@/components/serie/image-couverture";
import { Badge } from "@/components/ui/badge";
import { LienBouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";
import { Message } from "@/components/ui/message";
import { db } from "@/lib/db";
import { exigerConnexion } from "@/lib/session";
import { membreDeLaSerie } from "@/server/acces";
import { publierMaintenant, supprimerChapitre } from "@/server/actions/chapitres";
import { soumettreSerie } from "@/server/actions/series";
import { tousLesGenres } from "@/server/catalogue";

export const metadata: Metadata = { title: "Gérer la série", robots: { index: false } };

const TON = { BROUILLON: "neutre", EN_ATTENTE: "alerte", PUBLIEE: "succes", REFUSEE: "danger", RETIREE: "danger" } as const;
const TON_CHAPITRE = { BROUILLON: "neutre", EN_TRAITEMENT: "alerte", PROGRAMME: "accent", PUBLIE: "succes", RETIRE: "danger" } as const;

export default async function PageGestionSerie({ params }: PageProps<"/[locale]/equipe/series/[id]">) {
  const { locale, id } = await params;
  await exigerConnexion("/equipe");
  const acces = await membreDeLaSerie(id);
  if (!acces) notFound();

  const t = await getTranslations("Equipe");
  const tSerie = await getTranslations("Serie");
  const format = await getFormatter();
  const serie = await db.serie.findUniqueOrThrow({
    where: { id },
    include: {
      auteurs: { select: { auteur: { select: { nom: true } } } },
      genres: { select: { genre: { select: { slug: true } } } },
      chapitres: { orderBy: { numero: "desc" }, select: { id: true, numero: true, titre: true, statut: true, nbPages: true, programmePour: true, _count: { select: { pages: true } } } },
    },
  });
  const genres = (await tousLesGenres()).map((genre) => ({ slug: genre.slug, nom: locale === "en" ? genre.nomEn : genre.nomFr }));
  const prochain = String(Math.floor(Number(serie.chapitres[0]?.numero ?? 0)) + 1);
  const modifiable = acces.equipe.statut === "ACTIVE";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <Actualisation active={serie.chapitres.some((chapitre) => chapitre.statut === "EN_TRAITEMENT")} />
      <header className="flex gap-4">
        <div className="w-24 shrink-0">
          <ImageCouverture cle={serie.couvertureCle} couleur={serie.couleurDominante} alt="" sizes="96px" />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-2">
          <p className="text-sm font-semibold text-texte-doux">{acces.equipe.nom}</p>
          <h1 className="text-2xl leading-tight font-extrabold">{serie.titre}</h1>
          <Badge ton={TON[serie.statutModeration]}>{t(`moderation.${serie.statutModeration}`)}</Badge>
          <LienBouton href={{ pathname: "/serie/[slug]", params: { slug: serie.slug } }} variante="discret" taille="sm" className="-ml-3.5">
            {serie.statutModeration === "PUBLIEE" ? t("serie.voirPublique") : t("serie.apercu")}
          </LienBouton>
        </div>
      </header>

      {serie.statutModeration === "REFUSEE" && <Message ton="erreur">{t("serie.refusee", { motif: serie.motifRefus ?? "" })}</Message>}
      {modifiable && ["BROUILLON", "REFUSEE"].includes(serie.statutModeration) && (
        <BoutonAction action={soumettreSerie.bind(null, id)} variante="primaire" taille="md" succes={t("serie.soumise")}>
          {t("serie.soumettre")}
        </BoutonAction>
      )}

      {modifiable && (
        <Carte className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t("serie.couverture")}</h2>
          <p className="text-sm text-texte-doux">{t("serie.couvertureAide")}</p>
          <EnvoiFichier serieId={id} type="couverture" libelle={t("serie.choisirCouverture")} accepte="image/jpeg,image/png,image/webp,image/avif" />
        </Carte>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("serie.chapitres")}</h2>
          {modifiable && (
            <LienBouton href={{ pathname: "/equipe/series/[id]/chapitres/nouveau", params: { id }, query: { numero: prochain } }} taille="sm">
              <Plus className="size-4" aria-hidden />
              {t("serie.nouveauChapitre")}
            </LienBouton>
          )}
        </div>
        {serie.chapitres.length === 0 ? (
          <p className="text-texte-doux">{t("serie.aucunChapitre")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {serie.chapitres.map((chapitre) => (
              <li key={chapitre.id} className="flex flex-col gap-2 rounded-xl border border-bordure bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {tSerie("chapitre", { numero: chapitre.numero.toString() })}
                    {chapitre.titre && ` — ${chapitre.titre}`}
                    <span className="ml-2 text-sm font-normal text-texte-doux">{t("serie.planches", { nombre: chapitre.nbPages || chapitre._count.pages })}</span>
                  </p>
                  <Badge ton={TON_CHAPITRE[chapitre.statut]}>{t(`statutChapitre.${chapitre.statut}`)}</Badge>
                </div>
                {chapitre.statut === "PROGRAMME" && chapitre.programmePour && (
                  <p className="text-sm text-texte-doux">{t("serie.programmePour", { date: format.dateTime(chapitre.programmePour, { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }) })}</p>
                )}
                {modifiable && chapitre.statut !== "EN_TRAITEMENT" && (
                  <div className="flex flex-wrap gap-2">
                    {(chapitre.statut === "BROUILLON" || chapitre.statut === "PROGRAMME") && chapitre.nbPages > 0 && (
                      <BoutonAction action={publierMaintenant.bind(null, chapitre.id)}>{t("serie.publierMaintenant")}</BoutonAction>
                    )}
                    <BoutonAction action={supprimerChapitre.bind(null, chapitre.id)} variante="danger" confirmation={t("serie.confirmerSuppression")}>
                      {t("serie.supprimer")}
                    </BoutonAction>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {modifiable && (
        <section className="flex flex-col gap-4 border-t border-bordure pt-6">
          <FormulaireSerie
            serieId={id}
            genres={genres}
            valeurs={{
              titre: serie.titre, titresAlternatifs: serie.titresAlternatifs, synopsis: serie.synopsis, type: serie.type, langue: serie.langue,
              statut: serie.statut, classification: serie.classification, sensLecture: serie.sensLecture, anneeParution: serie.anneeParution,
              auteurs: serie.auteurs.map(({ auteur }) => auteur.nom), genres: serie.genres.map(({ genre }) => genre.slug),
              droitsDeclares: serie.droitsDeclares, preuveAutorisationNote: serie.preuveAutorisationNote ?? "",
            }}
          />
          <EnvoiFichier serieId={id} type="preuve" libelle={t("serie.preuveFichier")} accepte="application/pdf,image/jpeg,image/png,image/webp" succes={t("serie.preuveJointe")} />
          {serie.preuveAutorisationCle && <p className="text-sm text-texte-doux">{t("serie.preuveJointe")}</p>}
        </section>
      )}
    </div>
  );
}

