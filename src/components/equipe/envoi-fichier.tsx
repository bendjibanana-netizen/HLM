"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { classesBouton } from "@/components/ui/bouton";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";

/** Envoi d'un fichier lié à une série : sa couverture ou une preuve d'autorisation. */
export function EnvoiFichier({ serieId, type, libelle, accepte, succes }: { serieId: string; type: "couverture" | "preuve"; libelle: string; accepte: string; succes?: string }) {
  const t = useTranslations("Equipe.erreurs");
  const routeur = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur?: string; fait?: boolean }>({ enCours: false });

  async function envoyer(fichier: File) {
    setEtat({ enCours: true });
    const corps = new FormData();
    corps.set("type", type);
    corps.set("serieId", serieId);
    corps.set("fichier", fichier);
    const reponse = await fetch("/api/equipe/televersement", { method: "POST", body: corps }).catch(() => null);
    if (reponse?.ok) {
      setEtat({ enCours: false, fait: true });
      routeur.refresh();
    } else {
      const code = ((await reponse?.json().catch(() => null)) as { erreur?: string } | null)?.erreur ?? "DEFAUT";
      setEtat({ enCours: false, erreur: code });
    }
    if (champ.current) champ.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={`${classesBouton({ variante: "secondaire", taille: "sm" })} cursor-pointer self-start ${etat.enCours ? "pointer-events-none opacity-50" : ""}`}>
        <Upload className="size-4" aria-hidden />
        {libelle}
        <input ref={champ} type="file" accept={accepte} className="sr-only" onChange={(e) => e.target.files?.[0] && envoyer(e.target.files[0])} />
      </label>
      {etat.erreur && <Message ton="erreur">{t.has(etat.erreur) ? t(etat.erreur) : t("DEFAUT")}</Message>}
      {etat.fait && succes && <Message ton="succes">{succes}</Message>}
    </div>
  );
}
