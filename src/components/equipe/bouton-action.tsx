"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";

type Resultat = { ok: true } | { ok: false; erreur: string };

/**
 * Bouton qui déclenche une action serveur, affiche son erreur éventuelle et rafraîchit la page.
 * `messages` associe les codes d'erreur à leur texte ; `confirmation` demande un accord avant d'agir.
 */
export function BoutonAction({
  action,
  children,
  variante = "secondaire",
  taille = "sm",
  confirmation,
  succes,
  espace = "Equipe.erreurs",
}: {
  action: () => Promise<Resultat>;
  children: ReactNode;
  variante?: "primaire" | "secondaire" | "discret" | "danger";
  taille?: "sm" | "md" | "lg";
  confirmation?: string;
  succes?: string;
  /** Espace de traduction des codes d'erreur. */
  espace?: string;
}) {
  const t = useTranslations(espace);
  const routeur = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string; fait?: boolean }>({ enCours: false });

  async function lancer() {
    if (confirmation && !window.confirm(confirmation)) return;
    setEtat({ enCours: true });
    const resultat = await action().catch(() => ({ ok: false as const, erreur: "DEFAUT" }));
    setEtat(resultat.ok ? { enCours: false, fait: true } : { enCours: false, erreur: resultat.erreur });
    if (resultat.ok) routeur.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Bouton variante={variante} taille={taille} enCours={etat.enCours} onClick={lancer} className="self-start">
        {children}
      </Bouton>
      {etat.erreur && <Message ton="erreur">{t.has(etat.erreur) ? t(etat.erreur) : t("DEFAUT")}</Message>}
      {etat.fait && succes && <Message ton="succes">{succes}</Message>}
    </div>
  );
}
