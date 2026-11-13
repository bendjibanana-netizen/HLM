// Position de lecture d'un compte connecté.
//   GET  → lectures en cours (section « Reprendre ma lecture » de l'accueil)
//   POST → enregistre la position dans un chapitre (appelé par le lecteur)
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { obtenirSession } from "@/lib/session";
import { lecturesEnCours } from "@/server/catalogue";

export async function GET() {
  const session = await obtenirSession();
  if (!session) return NextResponse.json({ lectures: [] }, { status: 401 });

  const progressions = await lecturesEnCours(session.user.id);
  const lectures = progressions.map(({ serie, chapitre, page, ratio }) => ({
    slug: serie.slug,
    titre: serie.titre,
    couvertureCle: serie.couvertureCle,
    couleurDominante: serie.couleurDominante,
    numero: chapitre.numero.toString(),
    // Mode page par page : la page en cours ; mode vertical : la position de défilement.
    avancement: Math.max(ratio, chapitre.nbPages > 1 ? page / (chapitre.nbPages - 1) : 0),
  }));
  return NextResponse.json({ lectures }, { headers: { "Cache-Control": "private, no-store" } });
}

const schema = z.object({
  slug: z.string().min(1).max(200),
  numero: z.string().regex(/^\d{1,5}(\.\d{1,2})?$/),
  page: z.number().int().min(0).max(5000),
  ratio: z.number().min(0).max(1),
  termine: z.boolean(),
});

export async function POST(requete: Request) {
  const session = await obtenirSession();
  if (!session) return NextResponse.json({ erreur: "NON_CONNECTE" }, { status: 401 });

  // Le lecteur envoie parfois la position à la fermeture de la page (sendBeacon) : corps JSON brut.
  const donnees = schema.safeParse(await requete.json().catch(() => null));
  if (!donnees.success) return NextResponse.json({ erreur: "DONNEES_INVALIDES" }, { status: 400 });
  const { slug, numero, page, ratio, termine } = donnees.data;

  const chapitre = await db.chapitre.findFirst({
    where: { numero, statut: "PUBLIE", serie: { slug, statutModeration: "PUBLIEE" } },
    select: { id: true, serieId: true },
  });
  if (!chapitre) return NextResponse.json({ erreur: "INTROUVABLE" }, { status: 404 });

  const position = { chapitreId: chapitre.id, page, ratio, termine };
  await db.progression.upsert({
    where: { userId_serieId: { userId: session.user.id, serieId: chapitre.serieId } },
    update: position,
    create: { userId: session.user.id, serieId: chapitre.serieId, ...position },
  });
  return new NextResponse(null, { status: 204 });
}
