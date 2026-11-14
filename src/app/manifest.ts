import type { MetadataRoute } from "next";
import { NOM_SITE } from "@/lib/site";

// Manifeste de l'application web : permet de l'installer sur l'écran d'accueil du téléphone.
export default function manifeste(): MetadataRoute.Manifest {
  return {
    name: NOM_SITE,
    short_name: NOM_SITE,
    description: "Webtoons, mangas et manhwas à lire en ligne.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0e12",
    theme_color: "#0e0e12",
    lang: "fr",
    categories: ["books", "entertainment"],
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
