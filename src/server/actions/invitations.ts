"use server";

// Invitations : l'admin invite un auteur à créer une équipe ; un chef d'équipe invite des membres.
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { envoyerEmail } from "@/lib/emails/envoi";
import { emailInvitation } from "@/lib/emails/modeles";
import { env } from "@/lib/env";
import { enSlug } from "@/lib/texte";
import { compteActif, compteAvecRole, membreDe, refus, type Resultat } from "@/server/acces";

const DUREE_VALIDITE_JOURS = 14;
const hacher = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

const schemaInvitation = z.object({
  email: z.email().max(200).transform((valeur) => valeur.trim().toLowerCase()),
  /** Équipe à rejoindre ; absent = l'invité crée sa propre équipe (réservé à l'admin). */
  equipeId: z.string().optional(),
  nomEquipePropose: z.string().trim().max(60).optional(),
  langue: z.enum(["fr", "en"]).default("fr"),
});

export async function creerInvitation(donnees: z.input<typeof schemaInvitation>): Promise<Resultat<{ lien: string }>> {
  const valide = schemaInvitation.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const { email, equipeId, nomEquipePropose, langue } = valide.data;

  let invitePar: { id: string; name: string };
  let nomEquipe: string | null = null;
  if (equipeId) {
    const acces = await membreDe(equipeId, { chef: true, ecriture: true });
    if (!acces) return refus("INTERDIT");
    invitePar = acces.compte;
    nomEquipe = acces.equipe.nom;
    const dejaMembre = await db.membreEquipe.findFirst({ where: { equipeId, user: { email } } });
    if (dejaMembre) return refus("DEJA_MEMBRE");
  } else {
    const admin = await compteAvecRole("ADMIN");
    if (!admin) return refus("INTERDIT");
    invitePar = admin;
  }

  // Le jeton n'existe en clair que dans le lien envoyé : la base n'en garde que l'empreinte.
  const jeton = randomBytes(32).toString("base64url");
  await db.invitation.create({
    data: {
      email,
      jetonHache: hacher(jeton),
      type: equipeId ? "REJOINDRE_EQUIPE" : "NOUVELLE_EQUIPE",
      equipeId,
      nomEquipePropose: equipeId ? null : nomEquipePropose || null,
      creeParId: invitePar.id,
      expireLe: new Date(Date.now() + DUREE_VALIDITE_JOURS * 24 * 60 * 60 * 1000),
    },
  });

  const lien = `${env.APP_URL}${langue === "en" ? "/en" : ""}/invitation/${jeton}`;
  await envoyerEmail({ a: email, ...emailInvitation(langue, invitePar.name, nomEquipe, lien, DUREE_VALIDITE_JOURS) });
  revalidatePath("/", "layout");
  return { ok: true, lien };
}

export async function revoquerInvitation(id: string): Promise<Resultat> {
  const invitation = await db.invitation.findUnique({ where: { id }, select: { equipeId: true, accepteeLe: true } });
  if (!invitation || invitation.accepteeLe) return refus("INTROUVABLE");
  const autorise = invitation.equipeId ? await membreDe(invitation.equipeId, { chef: true }) : await compteAvecRole("ADMIN");
  if (!autorise) return refus("INTERDIT");
  await db.invitation.update({ where: { id }, data: { revoqueeLe: new Date() } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Invitation encore utilisable correspondant à un jeton, ou null. */
export async function invitationValide(jeton: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(jeton)) return null;
  const invitation = await db.invitation.findUnique({
    where: { jetonHache: hacher(jeton) },
    select: { id: true, email: true, type: true, equipeId: true, nomEquipePropose: true, roleEquipe: true, expireLe: true, accepteeLe: true, revoqueeLe: true, equipe: { select: { nom: true } } },
  });
  if (!invitation || invitation.accepteeLe || invitation.revoqueeLe || invitation.expireLe < new Date()) return null;
  return invitation;
}

const schemaAcceptation = z.object({ jeton: z.string(), nomEquipe: z.string().trim().min(2).max(60).optional() });

export async function accepterInvitation(donnees: z.input<typeof schemaAcceptation>): Promise<Resultat> {
  const valide = schemaAcceptation.safeParse(donnees);
  if (!valide.success) return refus("DONNEES_INVALIDES");
  const compte = await compteActif();
  if (!compte) return refus("NON_CONNECTE");
  const invitation = await invitationValide(valide.data.jeton);
  if (!invitation) return refus("INVITATION_INVALIDE");
  // L'invitation est personnelle : seul le compte de l'adresse invitée peut l'utiliser.
  if (invitation.email !== compte.email.toLowerCase()) return refus("EMAIL_DIFFERENT");

  if (invitation.type === "NOUVELLE_EQUIPE") {
    const nom = valide.data.nomEquipe;
    if (!nom) return refus("NOM_REQUIS");
    const slug = enSlug(nom);
    if (slug.length < 2) return refus("NOM_REQUIS");
    if (await db.equipe.findFirst({ where: { OR: [{ slug }, { nom: { equals: nom, mode: "insensitive" } }] } })) return refus("NOM_PRIS");
    await db.$transaction([
      db.equipe.create({ data: { nom, slug, membres: { create: { userId: compte.id, role: "CHEF" } } } }),
      db.invitation.update({ where: { id: invitation.id }, data: { accepteeLe: new Date(), accepteeParId: compte.id } }),
    ]);
  } else {
    await db.$transaction([
      db.membreEquipe.upsert({
        where: { equipeId_userId: { equipeId: invitation.equipeId!, userId: compte.id } },
        update: {},
        create: { equipeId: invitation.equipeId!, userId: compte.id, role: invitation.roleEquipe },
      }),
      db.invitation.update({ where: { id: invitation.id }, data: { accepteeLe: new Date(), accepteeParId: compte.id } }),
    ]);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
