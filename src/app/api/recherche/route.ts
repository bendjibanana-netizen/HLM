// Suggestions de la recherche instantanée de l'en-tête : GET /api/recherche?q=…
// Le navigateur ne parle jamais directement à Meilisearch : la clé reste sur le serveur.
import { NextResponse } from "next/server";
import { suggererSeries } from "@/lib/recherche/chercher";

export async function GET(requete: Request) {
  const q = new URL(requete.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ series: [] });

  try {
    const series = await suggererSeries(q);
    // Courte mise en cache : la même saisie retapée ne relance pas de recherche.
    return NextResponse.json({ series }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch {
    // Moteur de recherche injoignable : la barre reste utilisable, sans suggestions.
    return NextResponse.json({ series: [] }, { status: 503 });
  }
}
