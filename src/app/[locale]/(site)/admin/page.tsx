import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CheminStatique } from "@/i18n/routing";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default async function PageAdmin() {
  await exigerRole("ADMIN", "/admin");
  const t = await getTranslations("Admin");
  const [seriesEnAttente, signalements, retraits] = await Promise.all([
    db.serie.count({ where: { statutModeration: "EN_ATTENTE" } }),
    db.signalement.count({ where: { statut: { in: ["OUVERT", "EN_COURS"] } } }),
    db.demandeRetrait.count({ where: { statut: { in: ["RECUE", "EN_EXAMEN"] } } }),
  ]);

  const rubriques: { chemin: CheminStatique; titre: string; aide: string; compteur?: number }[] = [
    { chemin: "/admin/invitations", titre: t("invitations"), aide: t("invitationsAide") },
    { chemin: "/moderation", titre: t("moderation"), aide: t("moderationAide"), compteur: seriesEnAttente + signalements },
    { chemin: "/admin/retraits", titre: t("retraits"), aide: t("retraitsAide"), compteur: retraits },
    { chemin: "/admin/bots", titre: t("bots"), aide: t("botsAide") },
    { chemin: "/admin/publicite", titre: t("publicite"), aide: t("publiciteAide") },
    { chemin: "/admin/revenus", titre: t("revenus"), aide: t("revenusAide") },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      <ul className="flex flex-col gap-2">
        {rubriques.map(({ chemin, titre, aide, compteur }) => (
          <li key={chemin}>
            <Link href={chemin} className="flex items-center gap-3 rounded-2xl border border-bordure bg-surface p-4 hover:bg-surface-2">
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{titre}</span>
                <span className="text-sm text-texte-doux">{aide}</span>
              </span>
              {Boolean(compteur) && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-sur-accent">{compteur}</span>}
              <ChevronRight className="size-5 shrink-0 text-texte-doux" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
