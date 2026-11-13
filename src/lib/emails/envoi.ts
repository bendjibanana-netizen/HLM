// Envoi des emails transactionnels via SMTP (Mailpit en local, un vrai fournisseur en production).
import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

type Email = {
  a: string;
  sujet: string;
  /** Version texte brut, toujours fournie (clients mail sans HTML, lecteurs d'écran). */
  texte: string;
  html: string;
};

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // Le port 465 impose TLS dès la connexion ; les autres passent par STARTTLS si disponible.
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" } : undefined,
    })
  : null;

export async function envoyerEmail({ a, sujet, texte, html }: Email): Promise<void> {
  if (!transport) {
    // Aucun serveur SMTP configuré : on affiche l'email dans le terminal pour ne pas bloquer le développement.
    console.warn(`[email] SMTP non configuré — email non envoyé à ${a}\nSujet : ${sujet}\n${texte}`);
    return;
  }
  await transport.sendMail({ from: env.EMAIL_EXPEDITEUR, to: a, subject: sujet, text: texte, html });
}
