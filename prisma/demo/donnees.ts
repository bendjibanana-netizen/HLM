// Jeu de données de démonstration. Tout est inventé : titres, auteurs, équipes et synopsis
// n'existent pas ailleurs. Il sert à essayer le catalogue, la recherche et le lecteur.

export type SerieDemo = {
  slug: string;
  titre: string;
  titresAlternatifs: string[];
  synopsis: string;
  type: "WEBTOON" | "MANGA" | "MANHWA" | "MANHUA";
  langue: "FR" | "EN";
  statut: "EN_COURS" | "TERMINE" | "EN_PAUSE";
  classification: "TOUT_PUBLIC" | "DOUZE_PLUS" | "SEIZE_PLUS";
  annee: number;
  equipe: string;
  auteurs: string[];
  genres: string[];
  /** Deux couleurs qui donnent son identité visuelle à la série. */
  palette: [string, string];
  nbChapitres: number;
  /** Âge en jours du chapitre le plus récent (0 = aujourd'hui). */
  dernierIlYA: number;
  /** Note moyenne visée, sur 10. */
  note: number;
  vues: number;
  /** Accroche du carrousel de l'accueil, si la série est mise en avant. */
  accroche?: string;
};

export const EQUIPES_DEMO = [
  { slug: "atelier-brume", nom: "Atelier Brume", description: "Collectif d'auteurs de webtoons fantastiques." },
  { slug: "studio-lanterne", nom: "Studio Lanterne", description: "Petite équipe spécialisée dans les récits du quotidien." },
  { slug: "encres-du-nord", nom: "Les Encres du Nord", description: "Mangas en noir et blanc, du polar au sport." },
];

export const SERIES_DEMO: SerieDemo[] = [
  {
    slug: "les-veilleurs-de-brume",
    titre: "Les Veilleurs de brume",
    titresAlternatifs: ["Veilleurs de brume", "The Mist Keepers"],
    synopsis:
      "Chaque nuit, une brume avale les rues basses de Port-Aval et efface ce qu'elle touche. Maïa, apprentie allumeuse de lanternes, découvre qu'elle peut y marcher sans disparaître. Reste à comprendre ce que la brume cherche.",
    type: "WEBTOON", langue: "FR", statut: "EN_COURS", classification: "DOUZE_PLUS", annee: 2025,
    equipe: "atelier-brume", auteurs: ["Maël Tisserand", "Inès Vauclair"], genres: ["fantastique", "aventure", "mystere"],
    palette: ["#1f3a5f", "#f2a65a"], nbChapitres: 5, dernierIlYA: 0, note: 8.9, vues: 48200,
    accroche: "La brume efface tout. Sauf elle.",
  },
  {
    slug: "cafe-minuit",
    titre: "Café Minuit",
    titresAlternatifs: ["Midnight Café"],
    synopsis:
      "Un café qui n'ouvre qu'entre minuit et l'aube, une patronne qui ne pose jamais de questions, et des habitués qui n'arrivent pas à dormir. Chaque chapitre, une tasse et une histoire.",
    type: "WEBTOON", langue: "FR", statut: "EN_COURS", classification: "TOUT_PUBLIC", annee: 2024,
    equipe: "studio-lanterne", auteurs: ["Lina Orsay"], genres: ["tranche-de-vie", "romance", "comedie"],
    palette: ["#5b3a29", "#f6d9a8"], nbChapitres: 5, dernierIlYA: 1, note: 8.4, vues: 39100,
    accroche: "Ouvert de minuit à l'aube.",
  },
  {
    slug: "ligne-9",
    titre: "Ligne 9",
    titresAlternatifs: ["Line 9", "La Ligne neuf"],
    synopsis:
      "Le dernier métro de la ligne 9 s'arrête à une station qui ne figure sur aucun plan. Un conducteur de nuit et une journaliste remontent la piste des voyageurs qui n'en sont jamais ressortis.",
    type: "MANGA", langue: "FR", statut: "EN_COURS", classification: "SEIZE_PLUS", annee: 2025,
    equipe: "encres-du-nord", auteurs: ["Théo Brémont"], genres: ["thriller", "mystere", "horreur"],
    palette: ["#111111", "#c8102e"], nbChapitres: 4, dernierIlYA: 2, note: 9.1, vues: 52700,
    accroche: "Terminus : une station qui n'existe pas.",
  },
  {
    slug: "le-dernier-phare",
    titre: "Le Dernier Phare",
    titresAlternatifs: ["The Last Lighthouse"],
    synopsis:
      "En 1923, sur une île que les cartes oublient, une gardienne de phare recueille un naufragé qui prétend venir d'un pays disparu. Récit complet en quatre chapitres.",
    type: "MANGA", langue: "FR", statut: "TERMINE", classification: "TOUT_PUBLIC", annee: 2023,
    equipe: "encres-du-nord", auteurs: ["Noé Castel", "Yuna Marchetti"], genres: ["drame", "historique"],
    palette: ["#2b2b2b", "#e8e2d0"], nbChapitres: 4, dernierIlYA: 40, note: 8.7, vues: 21400,
  },
  {
    slug: "circuit-fantome",
    titre: "Circuit Fantôme",
    titresAlternatifs: ["Ghost Circuit"],
    synopsis:
      "Dans une ville où les courses de drones décident des élections de quartier, Ilan pilote une machine rafistolée contre les écuries des grandes tours. Son copilote est une voix qu'il est le seul à entendre.",
    type: "MANHWA", langue: "FR", statut: "EN_COURS", classification: "DOUZE_PLUS", annee: 2025,
    equipe: "atelier-brume", auteurs: ["Sam Okoro"], genres: ["action", "science-fiction", "sport"],
    palette: ["#0b132b", "#3ddc97"], nbChapitres: 4, dernierIlYA: 3, note: 7.8, vues: 30800,
  },
  {
    slug: "paper-kites",
    titre: "Paper Kites",
    titresAlternatifs: ["Cerfs-volants de papier"],
    synopsis:
      "Three cousins inherit their grandmother's kite workshop and one summer to save it. A gentle story about glue, string and learning to let go.",
    type: "WEBTOON", langue: "EN", statut: "EN_COURS", classification: "TOUT_PUBLIC", annee: 2024,
    equipe: "studio-lanterne", auteurs: ["Elio Darvenne"], genres: ["tranche-de-vie", "comedie"],
    palette: ["#3a86c8", "#ffd166"], nbChapitres: 4, dernierIlYA: 5, note: 8.1, vues: 17600,
  },
  {
    slug: "hollow-tide",
    titre: "Hollow Tide",
    titresAlternatifs: ["Marée creuse"],
    synopsis:
      "When the tide goes out in Morrow Bay, it leaves doors standing in the sand. Wren has until the water returns to find the one her brother walked through.",
    type: "MANHWA", langue: "EN", statut: "EN_COURS", classification: "SEIZE_PLUS", annee: 2025,
    equipe: "atelier-brume", auteurs: ["Inès Vauclair"], genres: ["horreur", "surnaturel", "mystere"],
    palette: ["#0d1b2a", "#7fd1c7"], nbChapitres: 3, dernierIlYA: 6, note: 8.3, vues: 26300,
  },
  {
    slug: "les-jardins-suspendus",
    titre: "Les Jardins suspendus",
    titresAlternatifs: ["Hanging Gardens", "Jardins suspendus"],
    synopsis:
      "Au sommet d'une cité bâtie en terrasses, une jardinière impériale reçoit l'ordre de faire fleurir un arbre mort depuis cent ans. Le prince héritier, lui, a tout intérêt à ce qu'elle échoue.",
    type: "MANHUA", langue: "FR", statut: "EN_COURS", classification: "TOUT_PUBLIC", annee: 2024,
    equipe: "studio-lanterne", auteurs: ["Lina Orsay", "Maël Tisserand"], genres: ["fantastique", "romance", "historique"],
    palette: ["#2d6a4f", "#f4acb7"], nbChapitres: 4, dernierIlYA: 4, note: 7.6, vues: 23900,
  },
  {
    slug: "zero-faute",
    titre: "Zéro Faute",
    titresAlternatifs: ["Zero Faute", "No Mistakes"],
    synopsis:
      "Le club d'escrime du lycée Saint-Roch n'a plus gagné un assaut depuis onze ans. Arrive Capucine, gauchère, mauvaise perdante, et bien décidée à ne plus jamais s'excuser de vouloir gagner.",
    type: "MANGA", langue: "FR", statut: "EN_COURS", classification: "TOUT_PUBLIC", annee: 2025,
    equipe: "encres-du-nord", auteurs: ["Yuna Marchetti"], genres: ["sport", "comedie", "tranche-de-vie"],
    palette: ["#1d1d1d", "#f4d35e"], nbChapitres: 4, dernierIlYA: 1, note: 8.0, vues: 28500,
  },
  {
    slug: "nord-nord-est",
    titre: "Nord-Nord-Est",
    titresAlternatifs: ["North-Northeast", "NNE"],
    synopsis:
      "Une cartographe, un chien de traîneau trop bavard et une boussole qui indique toujours la même direction, quelle que soit la façon dont on la tient. Série en pause entre deux saisons.",
    type: "WEBTOON", langue: "FR", statut: "EN_PAUSE", classification: "DOUZE_PLUS", annee: 2023,
    equipe: "atelier-brume", auteurs: ["Noé Castel"], genres: ["aventure", "mystere"],
    palette: ["#274060", "#e5e5e5"], nbChapitres: 3, dernierIlYA: 75, note: 7.2, vues: 12800,
  },
];

/** Répliques courtes des bulles et cartouches : assez pour donner du rythme aux planches de démo. */
export const REPLIQUES = {
  FR: ["On y va ?", "Attends…", "Regarde !", "C'était donc vrai.", "Pas un bruit.", "Encore un pas.", "Tu l'entends ?", "Trop tard.", "Reste là.", "Enfin."],
  EN: ["Shall we?", "Wait…", "Look!", "So it was true.", "Not a sound.", "One more step.", "Hear that?", "Too late.", "Stay here.", "At last."],
};
