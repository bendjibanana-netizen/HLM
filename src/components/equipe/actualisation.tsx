"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** Recharge les données de la page toutes les 3 secondes tant qu'un traitement est en cours. */
export function Actualisation({ active }: { active: boolean }) {
  const routeur = useRouter();
  useEffect(() => {
    if (!active) return;
    const minuterie = setInterval(() => routeur.refresh(), 3000);
    return () => clearInterval(minuterie);
  }, [active, routeur]);
  return null;
}
