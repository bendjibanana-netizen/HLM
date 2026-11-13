import { BellOff } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { BoutonAction } from "@/components/equipe/bouton-action";
import { EtatVide } from "@/components/ui/etat-vide";
import { db } from "@/lib/db";
import { exigerConnexion } from "@/lib/session";
import { toutMarquerLu } from "@/server/actions/notifications";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function PageNotifications() {
  const { user: compte } = await exigerConnexion("/notifications");
  const t = await getTranslations("Notifications");
  const format = await getFormatter();
  const notifications = await db.notification.findMany({ where: { userId: compte.id }, orderBy: { creeLe: "desc" }, take: 60 });
  const nonLues = notifications.filter((n) => !n.lueLe).length;

  if (notifications.length === 0) return <EtatVide icone={BellOff} titre={t("aucune")} />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 className="text-3xl font-extrabold">{t("titre")}</h1>
      {nonLues > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-texte-doux">{t("nonLues", { nombre: nonLues })}</p>
          <BoutonAction action={toutMarquerLu} espace="Communaute.erreurs">{t("toutLu")}</BoutonAction>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {notifications.map((notification) => {
          const donnees = notification.donnees as { serie?: string; numero?: string };
          return (
            <li key={notification.id}>
              {/* Lien simple : l'adresse est déjà dans la langue du lecteur. */}
              <a href={notification.lien ?? "#"} className={`flex items-center gap-3 rounded-xl border border-bordure p-3 hover:bg-surface-2 ${notification.lueLe ? "bg-surface" : "bg-accent/10"}`}>
                {!notification.lueLe && <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t("nouveauChapitre", { serie: donnees.serie ?? "", numero: donnees.numero ?? "" })}</span>
                  <time dateTime={notification.creeLe.toISOString()} className="text-sm text-texte-doux">{format.relativeTime(notification.creeLe)}</time>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
