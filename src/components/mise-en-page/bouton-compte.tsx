"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { classesBouton } from "@/components/ui/bouton";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

/**
 * Accès au compte dans l'en-tête : avatar si connecté, lien de connexion sinon.
 * La session est lue côté navigateur pour que les pages publiques restent statiques.
 */
export function BoutonCompte() {
  const t = useTranslations("Navigation");
  const { data: session, isPending: enAttente } = authClient.useSession();
  const [nonLues, setNonLues] = useState(0);
  const connecte = Boolean(session);

  // Pastille : nombre de notifications non lues, demandé une fois la session connue.
  useEffect(() => {
    if (!connecte) return;
    let annule = false;
    fetch("/api/notifications")
      .then((reponse) => reponse.json())
      .then((donnees: { nonLues: number }) => !annule && setNonLues(donnees.nonLues))
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [connecte]);

  // Emplacement de taille fixe : l'en-tête ne bouge pas quand la session arrive.
  if (enAttente) {
    return <span className="size-10 shrink-0 rounded-full bg-surface-2" aria-hidden />;
  }

  if (session) {
    return (
      <Link href={nonLues > 0 ? "/notifications" : "/compte"} aria-label={nonLues > 0 ? `${t("notifications")} (${nonLues})` : t("monCompte")} className="relative shrink-0 rounded-full">
        <Avatar nom={session.user.name} image={session.user.image} />
        {nonLues > 0 && <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 border-fond bg-accent" aria-hidden />}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile : icône seule */}
      <Link
        href="/connexion"
        aria-label={t("connexion")}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-texte md:hidden"
      >
        <LogIn className="size-5" aria-hidden />
      </Link>
      {/* Grand écran : bouton avec libellé */}
      <Link href="/connexion" className={cn(classesBouton({ taille: "sm" }), "hidden md:inline-flex")}>
        {t("connexion")}
      </Link>
    </>
  );
}
