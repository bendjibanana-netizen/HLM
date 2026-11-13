// Chiffrement au repos des données sensibles (IBAN, jetons d'accès des sources de synchronisation).
// AES-256-GCM : confidentialité et détection de toute modification du texte chiffré.
import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

// La clé est dérivée du secret de l'application : changer BETTER_AUTH_SECRET rend ces données illisibles.
const cle = createHash("sha256").update(`chiffrement:${env.BETTER_AUTH_SECRET}`).digest();

/** Chiffre un texte. Résultat : « v1.<iv>.<étiquette>.<données> » en base64url. */
export function chiffrer(clair: string): string {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cle, iv);
  const donnees = Buffer.concat([chiffreur.update(clair, "utf8"), chiffreur.final()]);
  return ["v1", iv, chiffreur.getAuthTag(), donnees].map((partie) => (typeof partie === "string" ? partie : partie.toString("base64url"))).join(".");
}

/** Déchiffre un texte produit par `chiffrer`. Lève une erreur si le texte a été altéré. */
export function dechiffrer(chiffre: string): string {
  const [version, iv, etiquette, donnees] = chiffre.split(".");
  if (version !== "v1" || !iv || !etiquette || !donnees) throw new Error("Format de donnée chiffrée inconnu.");
  const dechiffreur = createDecipheriv("aes-256-gcm", cle, Buffer.from(iv, "base64url"));
  dechiffreur.setAuthTag(Buffer.from(etiquette, "base64url"));
  return Buffer.concat([dechiffreur.update(Buffer.from(donnees, "base64url")), dechiffreur.final()]).toString("utf8");
}
