// Export CSV des montants à verser pour une période : GET /api/admin/revenus?periode=<id>
// Contient les coordonnées bancaires en clair : réservé à l'admin, jamais mis en cache.
import { NextResponse } from "next/server";
import { dechiffrer } from "@/lib/chiffrement";
import { db } from "@/lib/db";
import { celluleCsv } from "@/lib/revenus";
import { compteAvecRole } from "@/server/acces";

export async function GET(requete: Request) {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return new NextResponse(null, { status: 404 });
  const periode = await db.periodeRevenus.findUnique({
    where: { id: new URL(requete.url).searchParams.get("periode") ?? "" },
    include: { parts: { orderBy: { montantCentimes: "desc" }, include: { equipe: { select: { nom: true, infosPaiement: true } } } } },
  });
  if (!periode) return new NextResponse(null, { status: 404 });

  const mois = periode.mois.toISOString().slice(0, 7);
  const lignes = [["Mois", "Équipe", "Vues", "Montant (EUR)", "Statut", "Statut juridique", "Raison sociale", "SIRET", "Titulaire", "IBAN", "BIC", "Infos validées"]];
  for (const part of periode.parts) {
    const infos = part.equipe.infosPaiement;
    lignes.push([
      mois, part.equipe.nom, String(part.nbVues), (part.montantCentimes / 100).toFixed(2).replace(".", ","), part.statut,
      infos?.statutJuridique ?? "", infos?.raisonSociale ?? "", infos?.siret ?? "", infos?.titulaire ?? "",
      infos ? dechiffrer(infos.ibanChiffre) : "", infos?.bic ?? "", infos?.valideLe ? "oui" : "non",
    ]);
  }
  await db.journalModeration.create({ data: { acteurId: admin.id, action: "revenus.exporter", cibleType: "PERIODE", cibleId: periode.id } });
  // BOM UTF-8 : Excel affiche correctement les accents.
  const csv = "﻿" + lignes.map((ligne) => ligne.map(celluleCsv).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="versements-${mois}.csv"`, "Cache-Control": "private, no-store" },
  });
}
