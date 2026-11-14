import type { MetadataRoute } from "next";

const BASE = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

// Consignes aux moteurs de recherche : le catalogue est indexable, les espaces privés ne le sont pas.
export default function robots(): MetadataRoute.Robots {
  const prives = ["/api/", "/admin", "/moderation", "/equipe", "/team", "/compte", "/account", "/bibliotheque", "/library", "/notifications", "/connexion", "/login", "/inscription", "/signup", "/invitation/", "/design", "/hors-ligne", "/offline"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...prives, ...prives.filter((chemin) => !chemin.startsWith("/api")).map((chemin) => `/en${chemin}`)] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
