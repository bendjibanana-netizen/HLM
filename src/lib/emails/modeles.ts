// Modèles des emails transactionnels. Les textes viennent des fichiers de traduction
// (messages/fr.json et messages/en.json, section « Emails »).
import "server-only";
import { createTranslator } from "next-intl";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import { NOM_SITE } from "@/lib/site";

type LangueEmail = "fr" | "en";

const MESSAGES = { fr, en };

/** Convertit la langue du compte (FR/EN) en locale ; le français est la langue par défaut. */
export function langueEmail(langue: unknown): LangueEmail {
  return String(langue).toLowerCase() === "en" ? "en" : "fr";
}

/** Échappe le texte inséré dans le HTML d'un email. */
function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Gabarit commun : un titre, un paragraphe, un bouton d'action et une note de bas de page. */
function gabarit(titre: string, corps: string, libelleBouton: string, url: string, note: string) {
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f2ea;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#17161a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#fffdf8;border:1px solid #ddd5c5;border-radius:16px;">
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 20px;font-size:14px;font-weight:700;letter-spacing:.04em;">${echapper(NOM_SITE)}</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${echapper(titre)}</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">${echapper(corps)}</p>
          <a href="${echapper(url)}" style="display:inline-block;padding:14px 22px;background:#bd2e16;color:#ffffff;font-weight:700;text-decoration:none;border-radius:12px;">${echapper(libelleBouton)}</a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5f5b66;">${echapper(note)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  const texte = `${titre}\n\n${corps}\n\n${libelleBouton} : ${url}\n\n${note}`;
  return { html, texte };
}

export function emailVerification(langue: LangueEmail, nom: string, url: string) {
  const t = createTranslator({ locale: langue, messages: MESSAGES[langue], namespace: "Emails.verification" });
  const sujet = t("sujet", { site: NOM_SITE });
  return { sujet, ...gabarit(t("titre", { nom }), t("corps", { site: NOM_SITE }), t("bouton"), url, t("note")) };
}

export function emailReinitialisation(langue: LangueEmail, nom: string, url: string) {
  const t = createTranslator({ locale: langue, messages: MESSAGES[langue], namespace: "Emails.reinitialisation" });
  const sujet = t("sujet", { site: NOM_SITE });
  return { sujet, ...gabarit(t("titre", { nom }), t("corps"), t("bouton"), url, t("note")) };
}

export function emailInvitation(langue: LangueEmail, invitePar: string, equipe: string | null, url: string, jours: number) {
  const t = createTranslator({ locale: langue, messages: MESSAGES[langue], namespace: "Emails.invitation" });
  const sujet = t("sujet", { site: NOM_SITE });
  const corps = equipe ? t("corpsRejoindre", { invitePar, equipe, site: NOM_SITE }) : t("corpsNouvelle", { site: NOM_SITE });
  return { sujet, ...gabarit(t("titre"), corps, t("bouton"), url, t("note", { jours })) };
}

/**
 * Emails adressés à l'auteur d'une demande de retrait. Rédigés en français et en anglais dans le même message :
 * la langue du demandeur n'est pas connue.
 */
export function emailRetrait(etape: "recue" | "acceptee" | "refusee", reference: string, oeuvre: string, reponse?: string) {
  const textes: Record<typeof etape, { titre: string; message: string }> = {
    recue: {
      titre: "Demande de retrait reçue",
      message: `Nous avons bien reçu votre demande concernant « ${oeuvre} ». Elle sera examinée dans les meilleurs délais. / We have received your takedown request about “${oeuvre}”. It will be reviewed promptly.`,
    },
    acceptee: {
      titre: "Demande de retrait acceptée",
      message: `Votre demande concernant « ${oeuvre} » a été acceptée : le contenu a été retiré. / Your request about “${oeuvre}” was accepted: the content has been removed.`,
    },
    refusee: {
      titre: "Demande de retrait refusée",
      message: `Votre demande concernant « ${oeuvre} » n'a pas été retenue. / Your request about “${oeuvre}” was not upheld.`,
    },
  };
  const { titre, message } = textes[etape];
  const corps = reponse ? `${message}\n\n${reponse}` : message;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f2ea;font-family:system-ui,sans-serif;color:#17161a;">
    <div style="max-width:520px;margin:0 auto;background:#fffdf8;border:1px solid #ddd5c5;border-radius:16px;padding:28px;">
      <p style="margin:0 0 16px;font-size:14px;font-weight:700;">${echapper(NOM_SITE)}</p>
      <h1 style="margin:0 0 12px;font-size:20px;">${echapper(titre)}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;white-space:pre-line;">${echapper(corps)}</p>
      <p style="margin:0;font-size:13px;color:#5f5b66;">Référence / Reference : ${echapper(reference)}</p>
    </div></body></html>`;
  return { sujet: `${titre} — ${reference}`, texte: `${titre}\n\n${corps}\n\nRéférence : ${reference}`, html };
}
