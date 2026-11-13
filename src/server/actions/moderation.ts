"use server";

// Modération : traitement des signalements, retrait de contenus, demandes de retrait des ayants droit.
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { envoyerEmail } from "@/lib/emails/envoi";
import { emailRetrait } from "@/lib/emails/modeles";
import { indexerSerie } from "@/lib/recherche/series";
import { compteAvecRole, refus, type Resultat } from "@/server/acces";
import { recalculerSerie } from "@/server/publication";
import { lireReglage } from "@/server/reglages";

/** Retire une série du site et de la recherche (elle reste en base pour l'historique). */
async function retirerSerie(serieId: string, acteurId: string, motif: string) {
  await db.$transaction([
    db.serie.update({ where: { id: serieId }, data: { statutModeration: "RETIREE", motifRefus: motif } }),
    db.miseEnAvant.deleteMany({ where: { serieId } }),
    db.journalModeration.create({ data: { acteurId, action: "serie.retirer", cibleType: "SERIE", cibleId: serieId, details: { motif } } }),
  ]);
  await indexerSerie(serieId).catch(() => {});
}

const schemaSignalement = z.object({
  signalementId: z.string(),
  /** REJETER : signalement infondé. RETIRER : le contenu visé est masqué ou retiré. SUSPENDRE : en plus, son auteur est suspendu 30 jours. */
  decision: z.enum(["REJETER", "RETIRER", "SUSPENDRE"]),
  commentaire: z.string().trim().max(1000).optional(),
});

export async function traiterSignalement(donnees: z.input<typeof schemaSignalement>): Promise<Resultat> {
  const moderateur = await compteAvecRole("MODERATEUR");
  if (!moderateur) return refus("INTERDIT");
  const valide = schemaSignalement.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { signalementId, decision, commentaire } = valide.data;

  const signalement = await db.signalement.findUnique({
    where: { id: signalementId },
    include: { commentaire: { select: { userId: true, chapitreId: true } }, critique: { select: { userId: true } }, chapitre: { select: { serieId: true } } },
  });
  if (!signalement || !["OUVERT", "EN_COURS"].includes(signalement.statut)) return refus("INTROUVABLE");

  let auteurVise: string | null = null;
  if (decision !== "REJETER") {
    const motif = commentaire || `Signalement : ${signalement.motif}`;
    if (signalement.cible === "COMMENTAIRE" && signalement.commentaireId) {
      await db.commentaire.update({ where: { id: signalement.commentaireId }, data: { masque: true, masqueParId: moderateur.id } });
      const chapitreId = signalement.commentaire!.chapitreId;
      await db.chapitre.update({ where: { id: chapitreId }, data: { nbCommentaires: await db.commentaire.count({ where: { chapitreId, masque: false } }) } });
      auteurVise = signalement.commentaire!.userId;
    } else if (signalement.cible === "CRITIQUE" && signalement.critiqueId) {
      await db.critique.update({ where: { id: signalement.critiqueId }, data: { masquee: true, masqueeParId: moderateur.id } });
      auteurVise = signalement.critique!.userId;
    } else if (signalement.cible === "CHAPITRE" && signalement.chapitreId) {
      await db.chapitre.update({ where: { id: signalement.chapitreId }, data: { statut: "RETIRE" } });
      await recalculerSerie(signalement.chapitre!.serieId);
    } else if (signalement.cible === "SERIE" && signalement.serieId) {
      await retirerSerie(signalement.serieId, moderateur.id, motif);
    } else if (signalement.cible === "UTILISATEUR") {
      auteurVise = signalement.utilisateurCibleId;
    }
    // Suspension de 30 jours : le compte ne peut plus publier ni commenter. Jamais appliquée à un admin.
    if (decision === "SUSPENDRE" && auteurVise) {
      await db.user.updateMany({ where: { id: auteurVise, role: { not: "ADMIN" } }, data: { suspenduJusquAu: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    }
  }

  await db.$transaction([
    db.signalement.update({
      where: { id: signalementId },
      data: { statut: decision === "REJETER" ? "REJETE" : "RESOLU", traiteParId: moderateur.id, traiteLe: new Date(), decision: commentaire || decision },
    }),
    db.journalModeration.create({
      data: { acteurId: moderateur.id, action: `signalement.${decision.toLowerCase()}`, cibleType: signalement.cible, cibleId: signalement.serieId ?? signalement.chapitreId ?? signalement.commentaireId ?? signalement.critiqueId ?? signalement.utilisateurCibleId ?? "", details: { signalementId, commentaire } },
    }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Demandes de retrait (ayants droit) ──────────────────────────

const schemaDemande = z.object({
  nomDemandeur: z.string().trim().min(2).max(120),
  qualite: z.enum(["AYANT_DROIT", "REPRESENTANT"]),
  organisation: z.string().trim().max(160).optional(),
  email: z.email().max(200),
  telephone: z.string().trim().max(40).optional(),
  adresse: z.string().trim().max(300).optional(),
  oeuvre: z.string().trim().min(2).max(200),
  descriptionDroits: z.string().trim().min(20).max(3000),
  urls: z.array(z.url().max(500)).min(1).max(30),
  declarationSurHonneur: z.literal(true),
  signature: z.string().trim().min(2).max(120),
  /** Champ piège invisible : rempli uniquement par les robots. */
  site: z.string().max(0).optional(),
});

/** Dépôt d'une demande de retrait par le formulaire public. */
export async function deposerDemandeRetrait(donnees: z.input<typeof schemaDemande>): Promise<Resultat<{ reference: string }>> {
  const valide = schemaDemande.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { site: _piege, ...demande } = valide.data;
  void _piege;

  // Limite de débit simple : cinq demandes par heure et par adresse email.
  if ((await db.demandeRetrait.count({ where: { email: demande.email, creeLe: { gte: new Date(Date.now() - 3600_000) } } })) >= 5) return refus("TROP_DE_DEMANDES");

  // Rattachement automatique à une série quand une des URL désigne une fiche ou un chapitre du site.
  const hote = (await headers()).get("host") ?? "";
  let serie: { id: string; equipeId: string } | null = null;
  for (const url of demande.urls) {
    const { host, pathname } = new URL(url);
    const slug = host === hote ? pathname.match(/\/(?:serie|series|lire|read)\/([a-z0-9-]+)/)?.[1] : undefined;
    if (slug) serie = await db.serie.findUnique({ where: { slug }, select: { id: true, equipeId: true } });
    if (serie) break;
  }

  const reference = `RET-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  await db.demandeRetrait.create({ data: { ...demande, reference, serieId: serie?.id, equipeId: serie?.equipeId } });
  await envoyerEmail({ a: demande.email, ...emailRetrait("recue", reference, demande.oeuvre) }).catch((erreur) => console.error("[email] accusé de réception non envoyé :", erreur));
  return { ok: true, reference };
}

const schemaDecision = z.object({
  demandeId: z.string(),
  accepter: z.boolean(),
  /** Série à retirer si la demande est acceptée (proposée automatiquement, modifiable par l'admin). */
  serieId: z.string().optional(),
  reponse: z.string().trim().min(5).max(3000),
});

/** Décision de l'admin. Une demande acceptée retire la série et compte contre son équipe. */
export async function deciderDemandeRetrait(donnees: z.input<typeof schemaDecision>): Promise<Resultat<{ equipeSuspendue: boolean }>> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  const valide = schemaDecision.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { demandeId, accepter, reponse } = valide.data;

  const demande = await db.demandeRetrait.findUnique({ where: { id: demandeId } });
  if (!demande || !["RECUE", "EN_EXAMEN"].includes(demande.statut)) return refus("INTROUVABLE");

  let equipeSuspendue = false;
  let serieId: string | null = null;
  let equipeId: string | null = null;
  if (accepter) {
    const serie = await db.serie.findUnique({ where: { id: valide.data.serieId ?? demande.serieId ?? "" }, select: { id: true, equipeId: true } });
    if (!serie) return refus("SERIE_REQUISE");
    serieId = serie.id;
    equipeId = serie.equipeId;
    await retirerSerie(serie.id, admin.id, `Demande de retrait ${demande.reference}`);

    // Plusieurs retraits justifiés entraînent la suspension de l'équipe.
    const equipe = await db.equipe.update({ where: { id: serie.equipeId }, data: { nbRetraitsJustifies: { increment: 1 } }, select: { nbRetraitsJustifies: true, statut: true } });
    if (equipe.statut === "ACTIVE" && equipe.nbRetraitsJustifies >= (await lireReglage("seuilRetraits"))) {
      await db.equipe.update({ where: { id: serie.equipeId }, data: { statut: "SUSPENDUE", suspendueLe: new Date(), motifSuspension: `${equipe.nbRetraitsJustifies} retraits justifiés` } });
      await db.journalModeration.create({ data: { acteurId: admin.id, action: "equipe.suspendre", cibleType: "EQUIPE", cibleId: serie.equipeId, details: { retraits: equipe.nbRetraitsJustifies } } });
      equipeSuspendue = true;
    }
  }

  await db.$transaction([
    db.demandeRetrait.update({
      where: { id: demandeId },
      data: { statut: accepter ? "ACCEPTEE" : "REFUSEE", justifiee: accepter, reponse, traiteParId: admin.id, traiteLe: new Date(), ...(serieId && { serieId, equipeId }) },
    }),
    db.journalModeration.create({ data: { acteurId: admin.id, action: accepter ? "retrait.accepter" : "retrait.refuser", cibleType: "DEMANDE_RETRAIT", cibleId: demandeId, details: { reference: demande.reference } } }),
  ]);
  await envoyerEmail({ a: demande.email, ...emailRetrait(accepter ? "acceptee" : "refusee", demande.reference, demande.oeuvre, reponse) }).catch((erreur) => console.error("[email] réponse non envoyée :", erreur));
  revalidatePath("/", "layout");
  return { ok: true, equipeSuspendue };
}

/** Lève la suspension d'une équipe (décision de l'admin). */
export async function leverSuspension(equipeId: string): Promise<Resultat> {
  const admin = await compteAvecRole("ADMIN");
  if (!admin) return refus("INTERDIT");
  await db.equipe.update({ where: { id: equipeId }, data: { statut: "ACTIVE", suspendueLe: null, motifSuspension: null } });
  await db.journalModeration.create({ data: { acteurId: admin.id, action: "equipe.reactiver", cibleType: "EQUIPE", cibleId: equipeId } });
  revalidatePath("/", "layout");
  return { ok: true };
}
