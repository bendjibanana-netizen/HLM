// Connexion à Meilisearch. La clé reste côté serveur : le navigateur passe par /api/recherche.
import "server-only";
import { Meilisearch } from "meilisearch";
import { env } from "@/lib/env";

export const meili = new Meilisearch({ host: env.MEILISEARCH_URL, apiKey: env.MEILISEARCH_CLE });

/** Nom de l'index des séries. */
export const INDEX_SERIES = "series";
