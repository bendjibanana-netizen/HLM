import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lecteur, type PageLecteur } from "@/components/lecteur/lecteur";
import { Avertissement16 } from "@/components/serie/avertissement-16";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { srcset, urlImage, varianteProche, type Variante } from "@/lib/images/variantes";
import { obtenirSession } from "@/lib/session";
import { peutPrevisualiser } from "@/server/acces";
import { emplacementActif } from "@/components/pub/emplacement";
import { creerJetonVue } from "@/lib/vues";
import { chapitrePourLecture } from "@/server/catalogue";

export async function generateMetadata({ params }: PageProps<"/[locale]/lire/[slug]/[numero]">): Promise<Metadata> {
  const { locale, slug, numero } = await params;
  const donnees = await chapitrePourLecture(slug, numero);
  if (!donnees) return {};
  const t = await getTranslations({ locale, namespace: "Lecteur" });
  return { title: `${donnees.serie.titre} · ${t("chapitre", { numero: donnees.chapitre.numero.toString() })}` };
}

export default async function PageLecture({ params }: PageProps<"/[locale]/lire/[slug]/[numero]">) {
  const { locale, slug, numero: numeroDemande } = await params;
  setRequestLocale(locale);

  // L'équipe et la modération peuvent lire un chapitre avant sa publication (aperçu).
  const donnees = await chapitrePourLecture(slug, numeroDemande, await peutPrevisualiser(slug));
  if (!donnees) notFound();
  const { serie, chapitre, precedent, suivant } = donnees;
  const numero = chapitre.numero.toString();

  // Les visiteurs ne lisent que les séries tout public : au-delà, un compte est demandé.
  const session = await obtenirSession();
  if (serie.classification !== "TOUT_PUBLIC" && !session) {
    const suite = getPathname({ href: { pathname: "/lire/[slug]/[numero]", params: { slug, numero } }, locale: locale as Locale });
    redirect({ href: { pathname: "/connexion", query: { suite } }, locale });
  }

  // Position enregistrée sur le compte, si ce chapitre est bien celui en cours de lecture.
  const progression = session
    ? await db.progression.findUnique({
        where: { userId_serieId: { userId: session.user.id, serieId: serie.id } },
        select: { chapitreId: true, page: true, ratio: true },
      })
    : null;

  const versSources = (variantes: unknown) => {
    const liste = variantes as Variante[];
    return { avif: srcset(liste, "avif"), webp: srcset(liste, "webp"), secours: varianteProche(liste, "webp", 800) };
  };

  const pages: PageLecteur[] = chapitre.pages.map((page) => {
    const { avif, webp, secours } = versSources(page.variantes);
    return {
      id: page.id,
      largeur: page.largeur,
      hauteur: page.hauteur,
      avif,
      webp,
      src: secours ? urlImage(secours.cle) : "",
      apercu: page.apercuFlou,
    };
  });

  const publie = chapitre.statut === "PUBLIE";
  const emplacement = publie ? await emplacementActif("lecteur-fin-chapitre") : null;
  const tPub = await getTranslations("Pub");

  const lecteur = (
    <Lecteur
      // La clé force un état neuf à chaque changement de chapitre.
      key={`${slug}-${numero}`}
      serie={{ slug: serie.slug, titre: serie.titre, sensLecture: serie.sensLecture }}
      numero={numero}
      chapitreId={chapitre.statut === "PUBLIE" ? chapitre.id : null}
      nbCommentaires={chapitre.nbCommentaires}
      pages={pages}
      precedent={precedent?.numero.toString() ?? null}
      suivant={suivant?.numero.toString() ?? null}
      debutSuivant={(suivant?.pages ?? []).map((page) => {
        const { avif, webp } = versSources(page.variantes);
        return { avif, webp };
      })}
      positionServeur={progression?.chapitreId === chapitre.id ? { page: progression.page, ratio: progression.ratio } : null}
      connecte={Boolean(session)}
      jetonVue={publie ? creerJetonVue(chapitre.id) : null}
      pub={emplacement ? { ...emplacement, libelle: tPub("libelle") } : null}
    />
  );

  return serie.classification === "SEIZE_PLUS" ? <Avertissement16>{lecteur}</Avertissement16> : lecteur;
}
