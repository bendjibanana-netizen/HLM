"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
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

  // Emplacement de taille fixe : l'en-tête ne bouge pas quand la session arrive.
  if (enAttente) {
    return <span className="size-10 shrink-0 rounded-full bg-surface-2" aria-hidden />;
  }

  if (session) {
    return (
      <Link href="/compte" aria-label={t("monCompte")} className="shrink-0 rounded-full">
        <Avatar nom={session.user.name} image={session.user.image} />
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
