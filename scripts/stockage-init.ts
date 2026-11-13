// Prépare le stockage local : crée le bucket et règle les dossiers lisibles publiquement.
// Lancement : npm run stockage:init (sans effet si tout est déjà en place).
import "dotenv/config";
import { assurerBucket, DOSSIERS_PUBLICS } from "@/lib/stockage";

assurerBucket()
  .then(() => console.log(`Stockage prêt. Dossiers publics : ${DOSSIERS_PUBLICS.join(", ")}.`))
  .catch((erreur) => {
    console.error(erreur);
    process.exitCode = 1;
  });
