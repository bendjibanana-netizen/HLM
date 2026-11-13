// Notifications push (Web Push, protocole VAPID). Facultatives : sans clés configurées, rien n'est envoyé.
import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const pushConfigure = Boolean(env.NEXT_PUBLIC_VAPID_CLE_PUBLIQUE && env.VAPID_CLE_PRIVEE);
if (pushConfigure) webpush.setVapidDetails(env.APP_URL, env.NEXT_PUBLIC_VAPID_CLE_PUBLIQUE!, env.VAPID_CLE_PRIVEE!);

export type MessagePush = { titre: string; corps: string; lien: string; etiquette?: string };

/** Envoie une notification à tous les appareils d'un compte. Les abonnements expirés sont supprimés. */
export async function envoyerPush(userId: string, message: MessagePush): Promise<number> {
  if (!pushConfigure) return 0;
  const abonnements = await db.abonnementPush.findMany({ where: { userId } });
  let envoyes = 0;
  for (const abonnement of abonnements) {
    try {
      await webpush.sendNotification({ endpoint: abonnement.endpoint, keys: { p256dh: abonnement.p256dh, auth: abonnement.auth } }, JSON.stringify(message), { TTL: 24 * 60 * 60 });
      envoyes++;
    } catch (erreur) {
      // 404 ou 410 : le navigateur a révoqué l'abonnement.
      const code = (erreur as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.abonnementPush.delete({ where: { id: abonnement.id } }).catch(() => {});
      else console.error("[push] envoi impossible :", code ?? erreur);
    }
  }
  return envoyes;
}
