// Commentaires d'un chapitre publié : GET /api/commentaires?chapitre=<id>
// Chargés à la demande par le lecteur, pour ne pas alourdir l'ouverture du chapitre.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenirSession } from "@/lib/session";
import { commentairesDuChapitre } from "@/server/communaute";

export async function GET(requete: Request) {
  const chapitreId = new URL(requete.url).searchParams.get("chapitre") ?? "";
  const chapitre = await db.chapitre.findFirst({ where: { id: chapitreId, statut: "PUBLIE", serie: { statutModeration: "PUBLIEE" } }, select: { id: true } });
  if (!chapitre) return NextResponse.json({ commentaires: [] }, { status: 404 });
  const session = await obtenirSession();
  return NextResponse.json(
    { commentaires: await commentairesDuChapitre(chapitre.id, session?.user.id), connecte: Boolean(session) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
