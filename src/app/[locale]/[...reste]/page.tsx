import { notFound } from "next/navigation";

// Toute adresse inconnue aboutit ici, ce qui affiche la page 404 traduite (not-found.tsx).
export default function PageAttrapeTout() {
  notFound();
}
