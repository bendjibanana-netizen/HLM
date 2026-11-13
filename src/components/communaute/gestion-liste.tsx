"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { useRouter } from "@/i18n/navigation";
import { modifierListe, supprimerListe } from "@/server/actions/communaute";

/** Commandes du propriétaire d'une liste : visibilité et suppression. */
export function GestionListe({ listeId, nom, publique, supprimable }: { listeId: string; nom: string; publique: boolean; supprimable: boolean }) {
  const t = useTranslations("Communaute");
  const routeur = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    setEnCours(true);
    await modifierListe(listeId, { nom, publique: !publique });
    routeur.refresh();
    setEnCours(false);
  }
  async function supprimer() {
    if (!window.confirm(t("confirmerSuppressionListe"))) return;
    const resultat = await supprimerListe(listeId);
    if (resultat.ok) routeur.push("/bibliotheque");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Bouton variante="secondaire" taille="sm" enCours={enCours} onClick={basculer}>
        {publique ? t("rendrePrivee") : t("rendrePublique")}
      </Bouton>
      {supprimable && (
        <Bouton variante="danger" taille="sm" onClick={supprimer}>
          {t("supprimerListe")}
        </Bouton>
      )}
    </div>
  );
}
