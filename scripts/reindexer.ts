// Reconstruit l'index de recherche à partir de la base : npm run recherche:reindexer
// À lancer après une restauration de la base ou un changement des réglages de l'index.
import "dotenv/config";
import { db } from "@/lib/db";
import { reindexerToutesLesSeries } from "@/lib/recherche/series";

reindexerToutesLesSeries()
  .then((nombre) => console.log(`${nombre} séries indexées.`))
  .catch((erreur) => {
    console.error(erreur);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
