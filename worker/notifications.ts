// Annonce d'un nouveau chapitre aux lecteurs qui suivent la série : sur le site, en push et par email,
// selon les préférences de chacun.
// Version sans React de la bibliothèque de traduction : le worker n'est pas une application React.
import { createTranslator } from "use-intl/core";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import { db } from "@/lib/db";
import { envoyerEmail } from "@/lib/emails/envoi";
import { env } from "@/lib/env";
import { envoyerPush } from "@/lib/push";
import { NOM_SITE } from "@/lib/site";

const MESSAGES = { fr, en };
const echapper = (texte: string) => texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function notifierNouveauChapitre(chapitreId: string): Promise<{ site: number; push: number; emails: number }> {
  const chapitre = await db.chapitre.findFirst({
    where: { id: chapitreId, statut: "PUBLIE", serie: { statutModeration: "PUBLIEE" } },
    select: { numero: true, serie: { select: { id: true, slug: true, titre: true } } },
  });
  if (!chapitre) return { site: 0, push: 0, emails: 0 };
  const numero = chapitre.numero.toString();
  const { serie } = chapitre;

  const suivis = await db.suiviSerie.findMany({
    where: { serieId: serie.id, notifier: true },
    select: { user: { select: { id: true, email: true, emailVerified: true, langue: true, preferenceNotification: true } } },
  });
  const bilan = { site: 0, push: 0, emails: 0 };

  for (const { user } of suivis) {
    // Sans réglage enregistré : sur le site et en push, pas d'email.
    const preferences = user.preferenceNotification ?? { chapitreSite: true, chapitrePush: true, chapitreEmail: false };
    const langue = user.langue === "EN" ? "en" : "fr";
    const t = createTranslator({ locale: langue, messages: MESSAGES[langue], namespace: "Notifications" });
    const chemin = `${langue === "en" ? "/en/read" : "/lire"}/${serie.slug}/${numero}`;
    const titre = t("nouveauChapitre", { serie: serie.titre, numero });

    if (preferences.chapitreSite) {
      await db.notification.create({ data: { userId: user.id, type: "NOUVEAU_CHAPITRE", lien: chemin, donnees: { serie: serie.titre, slug: serie.slug, numero } } });
      bilan.site++;
    }
    if (preferences.chapitrePush) bilan.push += await envoyerPush(user.id, { titre: NOM_SITE, corps: titre, lien: chemin, etiquette: `serie-${serie.id}` });
    if (preferences.chapitreEmail && user.emailVerified) {
      const url = `${env.APP_URL}${chemin}`;
      const corps = t("emailCorps", { serie: serie.titre, numero });
      await envoyerEmail({
        a: user.email,
        sujet: t("emailSujet", { serie: serie.titre, numero }),
        texte: `${corps}\n\n${t("emailBouton")} : ${url}\n\n${t("emailNote")}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#17161a"><p style="font-weight:700">${echapper(NOM_SITE)}</p><h1 style="font-size:20px">${echapper(t("emailTitre"))}</h1><p>${echapper(corps)}</p><p><a href="${echapper(url)}" style="display:inline-block;padding:12px 20px;background:#bd2e16;color:#fff;font-weight:700;text-decoration:none;border-radius:12px">${echapper(t("emailBouton"))}</a></p><p style="font-size:13px;color:#5f5b66">${echapper(t("emailNote"))}</p></div>`,
      })
        .then(() => bilan.emails++)
        .catch((erreur) => console.error("[notifications] email non envoyé :", erreur));
    }
  }
  return bilan;
}
