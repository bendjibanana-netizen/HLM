import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Auteur } from "@/components/communaute/auteur";
import { GestionListe } from "@/components/communaute/gestion-liste";
import { CarteSerie } from "@/components/serie/carte-serie";
import { Badge } from "@/components/ui/badge";
import { obtenirSession } from "@/lib/session";
import { listeParSlug } from "@/server/communaute";

export async function generateMetadata({ params }: PageProps<"/[locale]/u/[pseudo]/liste/[slug]">): Promise<Metadata> {
  const { pseudo, slug } = await params;
  const liste = await listeParSlug(pseudo, slug);
  // Une liste privée n'est jamais décrite dans les métadonnées.
  return liste ? { title: `${liste.nom} — @${pseudo}`, description: liste.description ?? undefined } : { robots: { index: false } };
}

export default async function PageListe({ params }: PageProps<"/[locale]/u/[pseudo]/liste/[slug]">) {
  const { pseudo, slug } = await params;
  const session = await obtenirSession();
  const liste = await listeParSlug(pseudo, slug, session?.user.id);
  if (!liste) notFound();
  const t = await getTranslations("Communaute");
  const nom = liste.type === "LIBRE" ? liste.nom : t(`statuts.${liste.type}`);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <Auteur compte={liste.user} />
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold">{nom}</h1>
        {!liste.publique && (
          <Badge>
            <Lock className="size-3" aria-hidden />
            {t("listePrivee")}
          </Badge>
        )}
      </div>
      {liste.description && <p className="text-texte-doux">{liste.description}</p>}
      <p className="text-sm text-texte-doux">{t("series", { nombre: liste.elements.length })}</p>
      {liste.aMoi && <GestionListe listeId={liste.id} nom={liste.nom} publique={liste.publique} supprimable={liste.type === "LIBRE"} />}
      {liste.elements.length === 0 ? (
        <p className="text-texte-doux">{t("listeVide")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
          {liste.elements.map(({ serie }) => (
            <li key={serie.slug}>
              <CarteSerie serie={serie} sizes="(min-width: 640px) 160px, 30vw" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
