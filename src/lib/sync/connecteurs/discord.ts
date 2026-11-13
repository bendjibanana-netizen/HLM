// Connecteur Discord : lit un salon où l'équipe poste ses sorties. Chaque message contenant un numéro
// de chapitre et des images en pièces jointes est un chapitre. Nécessite le jeton d'un bot Discord
// ajouté par l'équipe à son propre serveur (droit « lire l'historique des messages »).
import "server-only";
import { comparerNaturel } from "@/lib/texte";
import { ErreurSync, telechargerImage, telechargerTexte } from "../recuperation";
import { extraireNumero } from "../regles";
import { IMAGES_MAX_PAR_CHAPITRE, type Connecteur } from "./types";

type Message = { id: string; content: string; attachments: { url: string; filename: string; content_type?: string }[] };

export const lireDiscord: Connecteur = async ({ config, secret }) => {
  const salon = String(config.salonId ?? "").trim();
  if (!/^\d{15,22}$/.test(salon)) throw new ErreurSync("Identifiant de salon Discord invalide.");
  if (!secret) throw new ErreurSync("Jeton du bot Discord manquant.");

  const messages = JSON.parse(await telechargerTexte(`https://discord.com/api/v10/channels/${salon}/messages?limit=50`, { Authorization: `Bot ${secret}` }, true)) as Message[];
  return messages.flatMap((message) => {
    const numero = extraireNumero(message.content.split("\n")[0] ?? "");
    const pieces = message.attachments.filter((piece) => (piece.content_type ?? "").startsWith("image/")).sort((a, b) => comparerNaturel(a.filename, b.filename)).slice(0, IMAGES_MAX_PAR_CHAPITRE);
    if (!numero || pieces.length === 0) return [];
    return [{ identifiantExterne: message.id, numero, titre: null, images: async () => { const images: Buffer[] = []; for (const piece of pieces) images.push(await telechargerImage(piece.url, undefined, true)); return images; } }];
  });
};
