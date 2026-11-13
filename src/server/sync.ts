// Exécution d'une source de synchronisation : détection des nouveaux chapitres, import, historique.
import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { dechiffrer } from "@/lib/chiffrement";
import { db } from "@/lib/db";
import { demanderTraitementChapitre } from "@/lib/files";
import { deposerFichierPrive } from "@/lib/stockage";
import { lireDiscord } from "@/lib/sync/connecteurs/discord";
import { lireDrive } from "@/lib/sync/connecteurs/drive";
import { lireRss } from "@/lib/sync/connecteurs/rss";
import { lireSite } from "@/lib/sync/connecteurs/site";
import type { Connecteur } from "@/lib/sync/connecteurs/types";
import { ErreurSync } from "@/lib/sync/recuperation";

const CONNECTEURS: Record<string, Connecteur> = { RSS: lireRss, SITE_AUTORISE: lireSite, GOOGLE_DRIVE: lireDrive, DISCORD: lireDiscord };
/** Nombre de chapitres importés au plus par passage : évite d'aspirer un catalogue entier d'un coup. */
const IMPORTS_MAX_PAR_PASSAGE = 3;
/** Après ce nombre d'échecs d'affilée, la source est mise en pause jusqu'à intervention de l'admin. */
const ERREURS_AVANT_PAUSE = 5;

export async function executerSource(sourceId: string, declencheeParId?: string): Promise<{ statut: "REUSSIE" | "ECHOUEE"; importes: number; erreur?: string }> {
  const source = await db.sourceSync.findUnique({ where: { id: sourceId }, include: { equipe: { select: { statut: true } }, serie: { select: { id: true, statutModeration: true } } } });
  if (!source) return { statut: "ECHOUEE", importes: 0, erreur: "Source introuvable." };
  const execution = await db.executionSync.create({ data: { sourceId, declencheeParId } });
  const journal: string[] = [];
  let detectes = 0;
  let importes = 0;

  try {
    // Garde-fous : source validée par l'admin, équipe active, série publiée.
    if (!source.valideeLe) throw new ErreurSync("La source n'a pas encore été validée par l'administration.");
    if (source.equipe.statut !== "ACTIVE") throw new ErreurSync("L'équipe est suspendue.");
    if (!source.serie || source.serie.statutModeration !== "PUBLIEE") throw new ErreurSync("La série liée n'est pas publiée.");
    const connecteur = CONNECTEURS[source.type];
    if (!connecteur) throw new ErreurSync(`Type de source inconnu : ${source.type}`);

    const chapitres = await connecteur({ url: source.url, config: (source.config ?? {}) as Record<string, unknown>, secret: source.secretChiffre ? dechiffrer(source.secretChiffre) : null });
    detectes = chapitres.length;

    const dejaImportes = new Set((await db.chapitreImporte.findMany({ where: { sourceId }, select: { identifiantExterne: true } })).map((c) => c.identifiantExterne));
    const existants = new Set((await db.chapitre.findMany({ where: { serieId: source.serie.id }, select: { numero: true } })).map((c) => c.numero.toString()));
    const nouveaux = chapitres
      .filter((c) => !dejaImportes.has(c.identifiantExterne) && !existants.has(c.numero))
      .sort((a, b) => Number(a.numero) - Number(b.numero))
      .slice(0, IMPORTS_MAX_PAR_PASSAGE);

    for (const chapitre of nouveaux) {
      const images = await chapitre.images();
      const valides: { contenu: Buffer; largeur: number; hauteur: number; format: string }[] = [];
      for (const contenu of images) {
        const meta = await sharp(contenu).metadata().catch(() => null);
        if (meta?.width && meta.height && meta.format) valides.push({ contenu, largeur: meta.width, hauteur: meta.height, format: meta.format });
      }
      if (valides.length === 0) {
        journal.push(`Chapitre ${chapitre.numero} : aucune image exploitable, ignoré.`);
        continue;
      }
      // Même circuit qu'un envoi manuel : originaux privés, puis traitement et publication par le worker.
      const cree = await db.chapitre.create({ data: { serieId: source.serie.id, numero: chapitre.numero, titre: chapitre.titre, statut: "EN_TRAITEMENT", origine: "SYNCHRONISATION", programmePour: new Date() }, select: { id: true } });
      for (const [ordre, image] of valides.entries()) {
        const cle = `prive/chapitres/${cree.id}/${randomUUID()}.${image.format}`;
        await deposerFichierPrive(cle, image.contenu, `image/${image.format}`);
        await db.page.create({ data: { chapitreId: cree.id, ordre, cleOriginale: cle, largeur: image.largeur, hauteur: image.hauteur } });
      }
      await db.chapitreImporte.create({ data: { sourceId, identifiantExterne: chapitre.identifiantExterne, chapitreId: cree.id } });
      await demanderTraitementChapitre(cree.id);
      importes++;
      journal.push(`Chapitre ${chapitre.numero} : ${valides.length} images importées.`);
    }

    await db.$transaction([
      db.executionSync.update({ where: { id: execution.id }, data: { statut: "REUSSIE", finLe: new Date(), nbDetectes: detectes, nbImportes: importes, journal } }),
      db.sourceSync.update({ where: { id: sourceId }, data: { dernierPassageLe: new Date(), dernierSuccesLe: new Date(), erreursConsecutives: 0 } }),
    ]);
    return { statut: "REUSSIE", importes };
  } catch (erreur) {
    // Les erreurs prévues (blocage, mise en page modifiée…) sont affichées telles quelles ; les autres restent génériques.
    const message = erreur instanceof ErreurSync ? erreur.message : `Erreur inattendue : ${erreur instanceof Error ? erreur.message : String(erreur)}`;
    const erreurs = source.erreursConsecutives + 1;
    await db.$transaction([
      db.executionSync.update({ where: { id: execution.id }, data: { statut: "ECHOUEE", finLe: new Date(), nbDetectes: detectes, nbImportes: importes, erreur: message.slice(0, 1000), journal } }),
      db.sourceSync.update({ where: { id: sourceId }, data: { dernierPassageLe: new Date(), erreursConsecutives: erreurs, ...(erreurs >= ERREURS_AVANT_PAUSE && { actif: false }) } }),
    ]);
    return { statut: "ECHOUEE", importes, erreur: message };
  }
}

/** Sources actives et validées dont le prochain passage est dû. */
export async function sourcesDues(): Promise<string[]> {
  const sources = await db.sourceSync.findMany({ where: { actif: true, valideeLe: { not: null } }, select: { id: true, dernierPassageLe: true, frequenceMinutes: true } });
  const maintenant = Date.now();
  return sources.filter((s) => !s.dernierPassageLe || s.dernierPassageLe.getTime() + s.frequenceMinutes * 60_000 <= maintenant).map((s) => s.id);
}
