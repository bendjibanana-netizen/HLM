import { Bookmark, Compass, House, UserRound, type LucideIcon } from "lucide-react";
import type { Chemin } from "@/i18n/routing";

/** Destinations principales, partagées par l'en-tête (grand écran) et la navigation basse (mobile). */
export const LIENS_PRINCIPAUX: { chemin: Chemin; cle: "accueil" | "catalogue" | "bibliotheque" | "compte"; icone: LucideIcon }[] = [
  { chemin: "/", cle: "accueil", icone: House },
  { chemin: "/catalogue", cle: "catalogue", icone: Compass },
  { chemin: "/bibliotheque", cle: "bibliotheque", icone: Bookmark },
  { chemin: "/compte", cle: "compte", icone: UserRound },
];

/** Vrai si la page affichée appartient à la destination (la page d'accueil ne correspond qu'à elle-même). */
export function estActif(cheminCourant: string, chemin: Chemin): boolean {
  if (chemin === "/") return cheminCourant === "/";
  return cheminCourant === chemin || cheminCourant.startsWith(`${chemin}/`);
}
