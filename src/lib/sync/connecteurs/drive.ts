// Connecteur Google Drive : un dossier partagé publiquement (« toute personne disposant du lien »),
// contenant un sous-dossier par chapitre (son nom contient le numéro) rempli d'images.
// Nécessite une clé d'API Google (variable GOOGLE_DRIVE_CLE_API).
import "server-only";
import { comparerNaturel } from "@/lib/texte";
import { ErreurSync, telechargerImage, telechargerTexte } from "../recuperation";
import { extraireNumero } from "../regles";
import { IMAGES_MAX_PAR_CHAPITRE, type Connecteur } from "./types";

const API = "https://www.googleapis.com/drive/v3/files";
type Fichier = { id: string; name: string; mimeType: string };

async function lister(dossierId: string, cle: string): Promise<Fichier[]> {
  const parametres = new URLSearchParams({ q: `'${dossierId}' in parents and trashed = false`, fields: "files(id,name,mimeType)", pageSize: "1000", key: cle });
  const reponse = JSON.parse(await telechargerTexte(`${API}?${parametres}`, undefined, true)) as { files?: Fichier[] };
  return reponse.files ?? [];
}

/** Identifiant du dossier à partir de son adresse de partage ou de l'identifiant seul. */
export function identifiantDossier(valeur: string): string | null {
  return valeur.match(/folders\/([A-Za-z0-9_-]{10,})/)?.[1] ?? (/^[A-Za-z0-9_-]{10,}$/.test(valeur.trim()) ? valeur.trim() : null);
}

export const lireDrive: Connecteur = async ({ url }) => {
  const cle = process.env.GOOGLE_DRIVE_CLE_API;
  if (!cle) throw new ErreurSync("La clé d'API Google Drive n'est pas configurée sur le serveur (GOOGLE_DRIVE_CLE_API).");
  const dossierId = identifiantDossier(url ?? "");
  if (!dossierId) throw new ErreurSync("Adresse de dossier Google Drive invalide.");

  const dossiers = (await lister(dossierId, cle)).filter((fichier) => fichier.mimeType === "application/vnd.google-apps.folder");
  if (dossiers.length === 0) throw new ErreurSync("Aucun sous-dossier trouvé : créez un dossier par chapitre (ex. « Chapitre 12 »).");

  return dossiers.flatMap((dossier) => {
    const numero = extraireNumero(dossier.name);
    if (!numero) return [];
    return [
      {
        identifiantExterne: dossier.id,
        numero,
        titre: null,
        images: async () => {
          const fichiers = (await lister(dossier.id, cle)).filter((fichier) => fichier.mimeType.startsWith("image/")).sort((a, b) => comparerNaturel(a.name, b.name)).slice(0, IMAGES_MAX_PAR_CHAPITRE);
          const images: Buffer[] = [];
          for (const fichier of fichiers) images.push(await telechargerImage(`${API}/${fichier.id}?alt=media&key=${encodeURIComponent(cle)}`, undefined, true));
          return images;
        },
      },
    ];
  });
};
