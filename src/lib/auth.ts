// Configuration de l'authentification (Better Auth) : email + mot de passe, Google, Discord.
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { envoyerEmail } from "@/lib/emails/envoi";
import { emailReinitialisation, emailVerification, langueEmail } from "@/lib/emails/modeles";
import { env, fournisseursSociaux } from "@/lib/env";
import { normaliserPseudo, pseudoDepuis, trouverPseudoLibre, validerPseudo } from "@/lib/pseudo";
import { NOM_SITE } from "@/lib/site";

export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

async function pseudoEstPris(pseudo: string): Promise<boolean> {
  return (await db.user.count({ where: { pseudo } })) > 0;
}

export const auth = betterAuth({
  appName: NOM_SITE,
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: LONGUEUR_MIN_MOT_DE_PASSE,
    autoSignIn: true,
    // La vérification de l'email n'empêche pas de se connecter ; elle sera exigée
    // pour publier (commentaires, critiques) dans les phases suivantes.
    requireEmailVerification: false,
    // Changer de mot de passe déconnecte tous les appareils : utile si le compte a été compromis.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const langue = langueEmail((user as { langue?: string }).langue);
      await envoyerEmail({ a: user.email, ...emailReinitialisation(langue, user.name, url) });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const langue = langueEmail((user as { langue?: string }).langue);
      await envoyerEmail({ a: user.email, ...emailVerification(langue, user.name, url) });
    },
  },

  // Les boutons Google et Discord n'apparaissent que si leurs identifiants sont renseignés.
  socialProviders: {
    ...(fournisseursSociaux.google && {
      google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! },
    }),
    ...(fournisseursSociaux.discord && {
      discord: { clientId: env.DISCORD_CLIENT_ID!, clientSecret: env.DISCORD_CLIENT_SECRET! },
    }),
  },

  account: {
    // Un lecteur inscrit par email peut ensuite se connecter avec Google ou Discord
    // (même adresse vérifiée par le fournisseur) sans créer un second compte.
    accountLinking: { enabled: true, trustedProviders: ["google", "discord"] },
  },

  user: {
    additionalFields: {
      // `input: false` : le champ ne peut pas être fixé par le navigateur à l'inscription.
      pseudo: { type: "string", required: false, input: true },
      langue: { type: "string", required: false, defaultValue: "FR", input: true },
      bio: { type: "string", required: false, input: false },
      role: { type: "string", required: false, defaultValue: "LECTEUR", input: false },
      suspenduJusquAu: { type: "date", required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Garantit un pseudo valide et unique pour chaque nouveau compte.
        before: async (utilisateur) => {
          const saisi = typeof utilisateur.pseudo === "string" ? normaliserPseudo(utilisateur.pseudo) : "";
          const langue = utilisateur.langue === "EN" ? "EN" : "FR";

          if (saisi) {
            // Inscription par formulaire : le pseudo choisi doit être valide et libre.
            if (validerPseudo(saisi)) {
              throw new APIError("UNPROCESSABLE_ENTITY", { code: "PSEUDO_INVALIDE", message: "Pseudo invalide" });
            }
            if (await pseudoEstPris(saisi)) {
              throw new APIError("UNPROCESSABLE_ENTITY", { code: "PSEUDO_DEJA_PRIS", message: "Pseudo déjà pris" });
            }
            return { data: { ...utilisateur, pseudo: saisi, langue } };
          }

          // Inscription via Google ou Discord : on dérive un pseudo du nom ou de l'email.
          const base = pseudoDepuis(utilisateur.name || utilisateur.email);
          const pseudo = await trouverPseudoLibre(base, pseudoEstPris);
          return { data: { ...utilisateur, pseudo, langue } };
        },
      },
    },
  },

  plugins: [
    // Permet à Better Auth de poser ses cookies depuis les Server Actions. Doit rester en dernier.
    nextCookies(),
  ],
});

/** Session telle que renvoyée par le serveur (compte + session en cours). */
export type SessionAuth = typeof auth.$Infer.Session;
