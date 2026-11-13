// Téléchargement de la preuve d'autorisation jointe à une série : GET /api/moderation/preuve?serie=<id>
// Fichier privé, servi uniquement à la modération et à l'administration.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lireFichier } from "@/lib/stockage";
import { compteAvecRole } from "@/server/acces";

const TYPES: Record<string, string> = { pdf: "application/pdf", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(requete: Request) {
  if (!(await compteAvecRole("MODERATEUR"))) return new NextResponse(null, { status: 404 });
  const serieId = new URL(requete.url).searchParams.get("serie") ?? "";
  const serie = await db.serie.findUnique({ where: { id: serieId }, select: { preuveAutorisationCle: true } });
  if (!serie?.preuveAutorisationCle) return new NextResponse(null, { status: 404 });

  const extension = serie.preuveAutorisationCle.split(".").pop() ?? "";
  const contenu = await lireFichier(serie.preuveAutorisationCle);
  return new NextResponse(new Uint8Array(contenu), {
    headers: {
      "Content-Type": TYPES[extension] ?? "application/octet-stream",
      // Affichage dans le navigateur, sans exécution possible, et jamais mis en cache partagé.
      "Content-Disposition": `inline; filename="preuve.${extension}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
