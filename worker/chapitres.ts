// Traitement d'un chapitre envoyé par une équipe : découpage des longues planches,
// déclinaisons AVIF/WebP, puis publication immédiate, programmée ou mise en brouillon.
import { db } from "@/lib/db";
import { decouperPlanche } from "@/lib/images/decoupage";
import { traiterPage } from "@/lib/images/traitement";
import { lireFichier } from "@/lib/stockage";
import { publierChapitre } from "@/server/publication";

export async function traiterChapitre(chapitreId: string): Promise<{ planches: number; statut: string }> {
  const chapitre = await db.chapitre.findUnique({
    where: { id: chapitreId },
    select: { id: true, serieId: true, statut: true, programmePour: true, pages: { orderBy: { ordre: "asc" } } },
  });
  if (!chapitre) throw new Error(`Chapitre introuvable : ${chapitreId}`);
  if (chapitre.statut !== "EN_TRAITEMENT") return { planches: chapitre.pages.length, statut: chapitre.statut };

  const dossier = `series/${chapitre.serieId}/chapitres/${chapitre.id}`;
  const traitees = [];
  for (const page of chapitre.pages) {
    // Chaque fichier d'origine peut donner plusieurs planches s'il s'agit d'une longue bande de webtoon.
    for (const segment of await decouperPlanche(await lireFichier(page.cleOriginale))) {
      traitees.push(await traiterPage(segment, dossier));
    }
  }
  if (traitees.length === 0) throw new Error("Le chapitre ne contient aucune planche.");

  // Remplacement atomique : le chapitre n'est jamais visible à moitié traité.
  await db.$transaction([
    db.page.deleteMany({ where: { chapitreId } }),
    db.page.createMany({ data: traitees.map((page, ordre) => ({ chapitreId, ordre, ...page })) }),
    db.chapitre.update({ where: { id: chapitreId }, data: { nbPages: traitees.length } }),
  ]);

  // Suite demandée par l'équipe à l'envoi : rien = brouillon, date passée = publier, date future = programmer.
  let statut = "BROUILLON";
  if (chapitre.programmePour && chapitre.programmePour.getTime() <= Date.now()) {
    await publierChapitre(chapitreId);
    statut = "PUBLIE";
  } else {
    statut = chapitre.programmePour ? "PROGRAMME" : "BROUILLON";
    await db.chapitre.update({ where: { id: chapitreId }, data: { statut: statut as "PROGRAMME" | "BROUILLON" } });
  }
  return { planches: traitees.length, statut };
}
