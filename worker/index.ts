// Processus d'arrière-plan : traite les files d'attente (npm run worker).
// À lancer en parallèle du site ; plusieurs exemplaires peuvent tourner en même temps.
import "dotenv/config";
import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { connexionRedis, file, FILE_CHAPITRES, type TacheChapitre } from "@/lib/files";
import { publierChapitresProgrammes } from "@/server/publication";
import { traiterChapitre } from "./chapitres";

const connection = connexionRedis();

const chapitres = new Worker<TacheChapitre>(
  FILE_CHAPITRES,
  async (tache) => {
    if (tache.data.type === "traiter") return traiterChapitre(tache.data.chapitreId);
    return { publies: await publierChapitresProgrammes() };
  },
  // L'encodage d'images occupe tout un cœur : deux chapitres à la fois suffisent.
  { connection, concurrency: 2 },
);

chapitres.on("completed", (tache, resultat) => {
  if (tache.name === "traiter" || (resultat as { publies?: number }).publies) {
    console.log(`[chapitres] ${tache.name} terminé :`, JSON.stringify(resultat));
  }
});
chapitres.on("failed", async (tache, erreur) => {
  console.error(`[chapitres] ${tache?.name} en échec (essai ${tache?.attemptsMade}) :`, erreur.message);
  // Après le dernier essai, le chapitre repasse en brouillon pour que l'équipe puisse relancer l'envoi.
  if (tache?.data.type === "traiter" && tache.attemptsMade >= (tache.opts.attempts ?? 1)) {
    await db.chapitre.updateMany({ where: { id: tache.data.chapitreId, statut: "EN_TRAITEMENT" }, data: { statut: "BROUILLON" } });
  }
});

/** Tâches répétées : enregistrées une fois, BullMQ évite les doublons entre plusieurs workers. */
async function planifier() {
  await file(FILE_CHAPITRES).upsertJobScheduler("publier-programmes", { every: 60_000 }, { name: "publier-programmes", data: { type: "publier-programmes" } });
}

const workers: Worker[] = [chapitres];

async function arreter() {
  console.log("[worker] arrêt en cours…");
  await Promise.all(workers.map((worker) => worker.close()));
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", arreter);
process.on("SIGINT", arreter);

planifier()
  .then(() => console.log("[worker] prêt — files :", workers.map((worker) => worker.name).join(", ")))
  .catch((erreur) => {
    console.error("[worker] démarrage impossible :", erreur);
    process.exit(1);
  });

export { workers };
