// Lecture et validation des variables d'environnement côté serveur.
// Toute variable manquante ou mal formée arrête le démarrage avec un message clair,
// plutôt que de provoquer une erreur obscure plus tard.
import "server-only";
import { z } from "zod";

/** Transforme une chaîne vide en « non défini » (cas des lignes `CLE=` du fichier .env). */
const optionnelle = z
  .string()
  .optional()
  .transform((valeur) => (valeur && valeur.trim() !== "" ? valeur.trim() : undefined));

const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL est obligatoire"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET doit contenir au moins 32 caractères (openssl rand -base64 32)"),

  GOOGLE_CLIENT_ID: optionnelle,
  GOOGLE_CLIENT_SECRET: optionnelle,
  DISCORD_CLIENT_ID: optionnelle,
  DISCORD_CLIENT_SECRET: optionnelle,

  SMTP_HOST: optionnelle,
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: optionnelle,
  SMTP_PASSWORD: optionnelle,
  EMAIL_EXPEDITEUR: z.string().default("HLM <ne-pas-repondre@localhost>"),

  S3_ENDPOINT: z.url().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("hlm"),
  S3_ACCESS_KEY_ID: z.string().default("cle-acces-dev"),
  S3_SECRET_ACCESS_KEY: z.string().default("cle-secrete-dev"),

  MEILISEARCH_URL: z.url().default("http://localhost:7700"),
  MEILISEARCH_CLE: optionnelle,
});

const resultat = schema.safeParse(process.env);

if (!resultat.success) {
  const details = resultat.error.issues
    .map((probleme) => `  - ${probleme.path.join(".")} : ${probleme.message}`)
    .join("\n");
  throw new Error(
    `Configuration invalide. Vérifiez le fichier .env (modèle : .env.example).\n${details}`,
  );
}

export const env = resultat.data;

/** Fournisseurs de connexion sociale réellement configurés. */
export const fournisseursSociaux = {
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  discord: Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
};
