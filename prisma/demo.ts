// Données de démonstration : équipes, séries, chapitres, planches, notes et mises en avant.
// Lancement : npm run db:demo — relançable, chaque exécution remplace la précédente.
// Tout le contenu est inventé et les images sont dessinées par code (voir prisma/demo/).
import "dotenv/config";
import { db } from "@/lib/db";
import { traiterPage, traiterVisuel } from "@/lib/images/traitement";
import { reindexerToutesLesSeries } from "@/lib/recherche/series";
import { assurerBucket, supprimerPrefixe } from "@/lib/stockage";
import { EQUIPES_DEMO, REPLIQUES, SERIES_DEMO, type SerieDemo } from "./demo/donnees";
import { aleatoire, banniere, couverture, plancheManga, plancheWebtoon } from "./demo/images";

const DOSSIER = "demo";
const DOMAINE_LECTEURS = "demo.invalid"; // domaine réservé : ces comptes ne peuvent ni recevoir d'email ni se connecter
const NB_LECTEURS = 12;
const JOUR = 24 * 60 * 60 * 1000;

const enSlug = (texte: string) =>
  texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Exécute les tâches par petits lots : l'encodage des images sollicite fortement le processeur. */
async function parLots<T, R>(elements: T[], taille: number, tache: (element: T, index: number) => Promise<R>): Promise<R[]> {
  const resultats: R[] = [];
  for (let i = 0; i < elements.length; i += taille) {
    resultats.push(...(await Promise.all(elements.slice(i, i + taille).map((e, j) => tache(e, i + j)))));
  }
  return resultats;
}

async function nettoyer() {
  const equipes = await db.equipe.findMany({ where: { slug: { in: EQUIPES_DEMO.map((e) => e.slug) } }, select: { id: true } });
  const ids = equipes.map((e) => e.id);
  await db.serie.deleteMany({ where: { equipeId: { in: ids } } });
  await db.equipe.deleteMany({ where: { id: { in: ids } } });
  await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAINE_LECTEURS}` } } });
  await db.auteur.deleteMany({ where: { series: { none: {} } } });
  const fichiers = await supprimerPrefixe(`${DOSSIER}/`);
  console.log(`• Nettoyage : ancienne démo retirée (${fichiers} fichiers).`);
}

async function creerLecteurs() {
  const lecteurs = [];
  for (let i = 1; i <= NB_LECTEURS; i++) {
    lecteurs.push(
      await db.user.create({
        data: { name: `Lecteur démo ${i}`, pseudo: `demo_lecteur_${i}`, email: `lecteur${i}@${DOMAINE_LECTEURS}`, emailVerified: true },
      }),
    );
  }
  return lecteurs;
}

async function creerSerie(demo: SerieDemo, equipeId: string, lecteurs: { id: string }[], maintenant: number) {
  const dossier = `${DOSSIER}/${demo.slug}`;
  const vertical = demo.type !== "MANGA";
  const alea = aleatoire(demo.slug);

  const visuel = await traiterVisuel(await couverture(demo.titre, demo.auteurs[0]!, demo.palette, demo.slug), dossier, "couverture");
  const fond = demo.accroche ? await traiterVisuel(await banniere(demo.palette, demo.slug), dossier, "banniere") : null;

  // Dates : un chapitre par semaine, le plus récent il y a `dernierIlYA` jours.
  const dateChapitre = (numero: number) =>
    new Date(maintenant - (demo.dernierIlYA + (demo.nbChapitres - numero) * 7) * JOUR - Math.floor(alea() * 6) * 60 * 60 * 1000);

  const serie = await db.serie.create({
    data: {
      slug: demo.slug,
      titre: demo.titre,
      titresAlternatifs: demo.titresAlternatifs,
      synopsis: demo.synopsis,
      type: demo.type,
      langue: demo.langue,
      statut: demo.statut,
      classification: demo.classification,
      sensLecture: vertical ? "VERTICAL" : "DROITE_A_GAUCHE",
      anneeParution: demo.annee,
      couvertureCle: visuel.cle,
      couleurDominante: visuel.couleurDominante,
      banniereCle: fond?.cle,
      equipeId,
      statutModeration: "PUBLIEE",
      publieeLe: dateChapitre(1),
      droitsDeclares: true,
      droitsDeclaresLe: dateChapitre(1),
      preuveAutorisationNote: "Série de démonstration créée pour la plateforme.",
      nbVues: demo.vues,
      nbChapitres: demo.nbChapitres,
      dernierChapitreLe: dateChapitre(demo.nbChapitres),
      genres: { create: demo.genres.map((slug) => ({ genre: { connect: { slug } } })) },
      auteurs: {
        create: demo.auteurs.map((nom) => ({
          auteur: { connectOrCreate: { where: { slug: enSlug(nom) }, create: { slug: enSlug(nom), nom } } },
        })),
      },
    },
  });

  // Chapitres et planches
  let nbPagesTotal = 0;
  for (let numero = 1; numero <= demo.nbChapitres; numero++) {
    const nbPages = vertical ? 5 : 8;
    const pages = await parLots(Array.from({ length: nbPages }, (_, i) => i), 4, async (i) => {
      const options = {
        graine: `${demo.slug}-${numero}-${i}`,
        palette: demo.palette,
        repliques: REPLIQUES[demo.langue],
        repere: `${demo.titre} · ${demo.langue === "EN" ? "Chapter" : "Chapitre"} ${numero} · ${i + 1}/${nbPages}`,
      };
      const image = vertical ? await plancheWebtoon(options) : await plancheManga(options);
      return { ordre: i, ...(await traiterPage(image, `${dossier}/chapitre-${numero}`)) };
    });
    await db.chapitre.create({
      data: {
        serieId: serie.id,
        numero,
        titre: null,
        statut: "PUBLIE",
        publieLe: dateChapitre(numero),
        nbPages,
        nbVues: Math.round((demo.vues / demo.nbChapitres) * (1.3 - numero * 0.1)),
        pages: { create: pages },
      },
    });
    nbPagesTotal += nbPages;
  }

  // Un chapitre programmé dans le futur pour une série en cours : il ne doit apparaître nulle part.
  if (demo.statut === "EN_COURS" && demo.dernierIlYA <= 1) {
    await db.chapitre.create({
      data: { serieId: serie.id, numero: demo.nbChapitres + 1, statut: "PROGRAMME", programmePour: new Date(maintenant + 3 * JOUR) },
    });
  }

  // Notes des lecteurs de démo, réparties autour de la note visée (entières, de 1 à 10).
  const notes = lecteurs.slice(0, 6 + Math.floor(alea() * (lecteurs.length - 5))).map((lecteur) => ({
    userId: lecteur.id,
    serieId: serie.id,
    valeur: Math.max(1, Math.min(10, Math.round(demo.note + (alea() - 0.5) * 3))),
  }));
  await db.note.createMany({ data: notes });
  const moyenne = notes.reduce((somme, note) => somme + note.valeur, 0) / notes.length;
  await db.serie.update({ where: { id: serie.id }, data: { noteMoyenne: Math.round(moyenne * 10) / 10, nbNotes: notes.length } });

  console.log(`• ${demo.titre} : ${demo.nbChapitres} chapitres, ${nbPagesTotal} planches, note ${(moyenne / 2).toFixed(1)}/5.`);
  return serie;
}

async function principal() {
  const debut = Date.now();
  await assurerBucket();
  await nettoyer();

  const equipes = new Map<string, string>();
  for (const equipe of EQUIPES_DEMO) {
    equipes.set(equipe.slug, (await db.equipe.create({ data: equipe })).id);
  }
  const lecteurs = await creerLecteurs();

  const maintenant = Date.now();
  let ordre = 0;
  for (const demo of SERIES_DEMO) {
    const serie = await creerSerie(demo, equipes.get(demo.equipe)!, lecteurs, maintenant);
    if (demo.accroche) {
      await db.miseEnAvant.create({ data: { serieId: serie.id, accroche: demo.accroche, ordre: ordre++ } });
    }
  }

  const indexees = await reindexerToutesLesSeries();
  console.log(`• Recherche : ${indexees} séries indexées.`);
  console.log(`Démo prête en ${Math.round((Date.now() - debut) / 1000)} s.`);
}

principal()
  .catch((erreur) => {
    console.error(erreur);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
