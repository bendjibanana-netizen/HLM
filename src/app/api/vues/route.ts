// Enregistrement d'une vue de chapitre : POST /api/vues { chapitreId, jeton }
// Appelé par le lecteur une fois que la lecture a réellement commencé.
import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenirSession } from "@/lib/session";
import { compterVue, identifiantVisiteur, MOTIF_ROBOT, verifierJetonVue } from "@/lib/vues";

const schema = z.object({ chapitreId: z.string().min(1).max(40), jeton: z.string().min(10).max(120) });
const ignoree = () => new NextResponse(null, { status: 204 });

export async function POST(requete: Request) {
  const agent = requete.headers.get("user-agent") ?? "";
  // Robots déclarés, navigateur absent, ou appel venu d'un autre site : la vue est ignorée sans erreur.
  if (!agent || MOTIF_ROBOT.test(agent)) return ignoree();
  const origine = requete.headers.get("origin");
  if (origine && new URL(origine).host !== requete.headers.get("host")) return ignoree();
  if ((requete.headers.get("sec-fetch-site") ?? "same-origin") !== "same-origin") return ignoree();

  const donnees = schema.safeParse(await requete.json().catch(() => null));
  if (!donnees.success || !verifierJetonVue(donnees.data.chapitreId, donnees.data.jeton)) return ignoree();

  const session = await obtenirSession();
  // Derrière un proxy inverse (voir le guide de déploiement), l'adresse du lecteur est dans X-Forwarded-For.
  const ip = requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || requete.headers.get("x-real-ip") || "inconnue";
  const visiteur = identifiantVisiteur(session?.user.id, ip, agent, new Date().toISOString().slice(0, 10));
  await compterVue(donnees.data.chapitreId, visiteur).catch((erreur) => console.error("[vues] comptage impossible :", erreur));
  return ignoree();
}
