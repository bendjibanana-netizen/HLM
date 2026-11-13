"use server";

// Création, modification et validation des séries.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { enSlug } from "@/lib/texte";
import { indexerSerie } from "@/lib/recherche/series";
import { compteAvecRole, membreDe, membreDeLaSerie, refus, type Resultat } from "@/server/acces";

const schemaSerie = z.object({
  titre: z.string().trim().min(1).max(120),
  titresAlternatifs: z.array(z.string().trim().min(1).max(120)).max(10),
  synopsis: z.string().trim().max(5000),
  type: z.enum(["WEBTOON", "MANGA", "MANHWA", "MANHUA"]),
  langue: z.enum(["FR", "EN"]),
  statut: z.enum(["EN_COURS", "TERMINE", "EN_PAUSE", "ABANDONNE"]),
  classification: z.enum(["TOUT_PUBLIC", "DOUZE_PLUS", "SEIZE_PLUS"]),
  sensLecture: z.enum(["VERTICAL", "DROITE_A_GAUCHE", "GAUCHE_A_DROITE"]),
  anneeParution: z.number().int().min(1900).max(2100).nullable(),
  auteurs: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  genres: z.array(z.string().regex(/^[a-z0-9-]{1,40}$/)).max(8),
  /** Case obligatoire : l'équipe déclare détenir les droits ou l'autorisation de l'ayant droit. */
  droitsDeclares: z.literal(true),
  preuveAutorisationNote: z.string().trim().max(2000),
});

export type DonneesSerie = z.input<typeof schemaSerie>;

/** Slug libre à partir du titre : « mon-titre », puis « mon-titre-2 », etc. */
async function slugLibre(titre: string, sauf?: string): Promise<string> {
  const base = enSlug(titre) || "serie";
  for (let suffixe = 1; ; suffixe++) {
    const slug = suffixe === 1 ? base : `${base}-${suffixe}`;
    const existante = await db.serie.findUnique({ where: { slug }, select: { id: true } });
    if (!existante || existante.id === sauf) return slug;
  }
}

/** Champs simples de la série, sans les listes (genres, auteurs) enregistrées dans des tables liées. */
function champsSimples(donnees: z.output<typeof schemaSerie>) {
  const champs: Partial<z.output<typeof schemaSerie>> = { ...donnees };
  delete champs.genres;
  delete champs.auteurs;
  return champs as Omit<z.output<typeof schemaSerie>, "genres" | "auteurs">;
}

function relations(donnees: z.output<typeof schemaSerie>) {
  return {
    genres: { create: donnees.genres.map((slug) => ({ genre: { connect: { slug } } })) },
    auteurs: {
      // Deux noms identiques à la casse près désignent le même auteur.
      create: [...new Map(donnees.auteurs.map((nom) => [enSlug(nom), nom])).entries()].map(([slug, nom]) => ({
        auteur: { connectOrCreate: { where: { slug }, create: { slug, nom } } },
      })),
    },
  };
}

export async function creerSerie(equipeId: string, donnees: DonneesSerie): Promise<Resultat<{ id: string }>> {
  const acces = await membreDe(equipeId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  const valide = schemaSerie.safeParse(donnees);
  if (!valide.success) return refus(valide.error.issues.some((p) => p.path[0] === "droitsDeclares") ? "DROITS_REQUIS" : "DONNEES_INVALIDES");
  const champs = champsSimples(valide.data);

  const serie = await db.serie.create({
    data: {
      ...champs,
      slug: await slugLibre(champs.titre),
      equipeId,
      droitsDeclaresLe: new Date(),
      droitsDeclaresParId: acces.compte.id,
      ...relations(valide.data),
    },
    select: { id: true },
  });
  revalidatePath("/", "layout");
  return { ok: true, id: serie.id };
}

export async function modifierSerie(serieId: string, donnees: DonneesSerie): Promise<Resultat> {
  const acces = await membreDeLaSerie(serieId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  const valide = schemaSerie.safeParse(donnees);
  if (!valide.success) return refus(valide.error.issues.some((p) => p.path[0] === "droitsDeclares") ? "DROITS_REQUIS" : "DONNEES_INVALIDES");
  const champs = champsSimples(valide.data);

  await db.$transaction([
    db.serieGenre.deleteMany({ where: { serieId } }),
    db.serieAuteur.deleteMany({ where: { serieId } }),
    // L'adresse d'une série déjà publiée ne change plus : les liens partagés restent valables.
    db.serie.update({ where: { id: serieId }, data: { ...champs, ...relations(valide.data) } }),
  ]);
  if (acces.serie.statutModeration === "PUBLIEE") await indexerSerie(serieId).catch(() => {});
  revalidatePath("/", "layout");
  return { ok: true };
}

/** L'équipe soumet sa série à la modération. Il faut une couverture et au moins un chapitre prêt. */
export async function soumettreSerie(serieId: string): Promise<Resultat> {
  const acces = await membreDeLaSerie(serieId, { ecriture: true });
  if (!acces) return refus("INTERDIT");
  if (!["BROUILLON", "REFUSEE"].includes(acces.serie.statutModeration)) return refus("DEJA_SOUMISE");
  const serie = await db.serie.findUnique({ where: { id: serieId }, select: { couvertureCle: true, _count: { select: { chapitres: { where: { nbPages: { gt: 0 } } } } } } });
  if (!serie?.couvertureCle) return refus("COUVERTURE_REQUISE");
  if (serie._count.chapitres === 0) return refus("CHAPITRE_REQUIS");
  await db.serie.update({ where: { id: serieId }, data: { statutModeration: "EN_ATTENTE", motifRefus: null } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const schemaDecision = z.object({ serieId: z.string(), accepter: z.boolean(), motif: z.string().trim().max(1000).optional() });

/** Décision de modération sur une série en attente. */
export async function deciderSerie(donnees: z.input<typeof schemaDecision>): Promise<Resultat> {
  const moderateur = await compteAvecRole("MODERATEUR");
  if (!moderateur) return refus("INTERDIT");
  const valide = schemaDecision.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { serieId, accepter, motif } = valide.data;
  if (!accepter && !motif) return refus("MOTIF_REQUIS");

  const serie = await db.serie.findUnique({ where: { id: serieId }, select: { statutModeration: true, publieeLe: true } });
  if (serie?.statutModeration !== "EN_ATTENTE") return refus("INTROUVABLE");

  await db.$transaction([
    db.serie.update({
      where: { id: serieId },
      data: accepter
        ? { statutModeration: "PUBLIEE", publieeLe: serie.publieeLe ?? new Date(), motifRefus: null }
        : { statutModeration: "REFUSEE", motifRefus: motif },
    }),
    db.journalModeration.create({
      data: { acteurId: moderateur.id, action: accepter ? "serie.valider" : "serie.refuser", cibleType: "SERIE", cibleId: serieId, details: motif ? { motif } : undefined },
    }),
  ]);
  await indexerSerie(serieId).catch(() => {});
  revalidatePath("/", "layout");
  return { ok: true };
}
