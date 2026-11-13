// Données initiales : compte administrateur et genres de base.
// Relançable sans risque : rien n'est créé en double.
// Les séries de démonstration arrivent avec la phase 2.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Instance minimale de Better Auth, utilisée uniquement pour hacher le mot de passe
// exactement comme le fera l'application.
const auth = betterAuth({
  baseURL: process.env.APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

const GENRES = [
  { slug: "action", nomFr: "Action", nomEn: "Action" },
  { slug: "aventure", nomFr: "Aventure", nomEn: "Adventure" },
  { slug: "comedie", nomFr: "Comédie", nomEn: "Comedy" },
  { slug: "drame", nomFr: "Drame", nomEn: "Drama" },
  { slug: "fantastique", nomFr: "Fantastique", nomEn: "Fantasy" },
  { slug: "horreur", nomFr: "Horreur", nomEn: "Horror" },
  { slug: "mystere", nomFr: "Mystère", nomEn: "Mystery" },
  { slug: "romance", nomFr: "Romance", nomEn: "Romance" },
  { slug: "science-fiction", nomFr: "Science-fiction", nomEn: "Sci-fi" },
  { slug: "sport", nomFr: "Sport", nomEn: "Sports" },
  { slug: "thriller", nomFr: "Thriller", nomEn: "Thriller" },
  { slug: "tranche-de-vie", nomFr: "Tranche de vie", nomEn: "Slice of life" },
  { slug: "historique", nomFr: "Historique", nomEn: "Historical" },
  { slug: "surnaturel", nomFr: "Surnaturel", nomEn: "Supernatural" },
];

async function creerAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const motDePasse = process.env.ADMIN_MOT_DE_PASSE;

  if (!email || !motDePasse) {
    console.log("• Admin : ADMIN_EMAIL ou ADMIN_MOT_DE_PASSE absent du .env, aucun compte créé.");
    return;
  }
  if (motDePasse.length < 8) {
    throw new Error("ADMIN_MOT_DE_PASSE doit contenir au moins 8 caractères.");
  }

  const existant = await db.user.findUnique({ where: { email } });
  if (existant) {
    // Le compte existe déjà : on s'assure seulement qu'il a bien le rôle admin.
    if (existant.role !== "ADMIN") {
      await db.user.update({ where: { id: existant.id }, data: { role: "ADMIN" } });
      console.log(`• Admin : ${email} existait déjà, rôle passé à ADMIN.`);
    } else {
      console.log(`• Admin : ${email} existe déjà.`);
    }
    return;
  }

  const contexte = await auth.$context;
  const utilisateur = await db.user.create({
    data: { name: "Admin", email, pseudo: "administration", emailVerified: true, role: "ADMIN" },
  });
  await db.account.create({
    data: {
      userId: utilisateur.id,
      providerId: "credential",
      accountId: utilisateur.id,
      password: await contexte.password.hash(motDePasse),
    },
  });
  console.log(`• Admin : compte ${email} créé.`);
}

async function creerGenres() {
  for (const genre of GENRES) {
    await db.genre.upsert({ where: { slug: genre.slug }, update: genre, create: genre });
  }
  console.log(`• Genres : ${GENRES.length} genres en place.`);
}

async function principal() {
  await creerAdmin();
  await creerGenres();
}

principal()
  .catch((erreur) => {
    console.error(erreur);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
