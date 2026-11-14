import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
// Reconstruit au plus une fois par heure.
export const revalidate = 3600;

/** Une entrée du plan du site avec son équivalent dans l'autre langue. */
function entree(fr: string, en: string, modifie?: Date | null, frequence: "daily" | "weekly" | "monthly" = "weekly", priorite = 0.5) {
  return { url: `${BASE}${fr}`, lastModified: modifie ?? undefined, changeFrequency: frequence, priority: priorite, alternates: { languages: { fr: `${BASE}${fr}`, en: `${BASE}/en${en}` } } };
}

export default async function planDuSite(): Promise<MetadataRoute.Sitemap> {
  // Pendant la compilation, la base peut être absente : le plan se limite alors aux pages fixes.
  const series = await db.serie.findMany({ where: { statutModeration: "PUBLIEE" }, orderBy: { dernierChapitreLe: "desc" }, take: 5000, select: { slug: true, majLe: true, dernierChapitreLe: true } }).catch(() => []);
  return [
    entree("/", "", null, "daily", 1),
    entree("/catalogue", "/browse", null, "daily", 0.8),
    ...series.map((serie) => entree(`/serie/${serie.slug}`, `/series/${serie.slug}`, serie.dernierChapitreLe ?? serie.majLe, "weekly", 0.7)),
    entree("/cgu", "/terms", null, "monthly", 0.2),
    entree("/mentions-legales", "/legal-notice", null, "monthly", 0.2),
    entree("/confidentialite", "/privacy", null, "monthly", 0.2),
    entree("/retrait", "/takedown", null, "monthly", 0.2),
  ];
}
