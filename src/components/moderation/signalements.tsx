import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Carte } from "@/components/ui/carte";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { DecisionSignalement } from "./decisions";

/** File des signalements ouverts, du plus ancien au plus récent, avec le contenu visé. */
export async function Signalements() {
  const t = await getTranslations();
  const format = await getFormatter();
  const signalements = await db.signalement.findMany({
    where: { statut: { in: ["OUVERT", "EN_COURS"] } },
    orderBy: { creeLe: "asc" },
    take: 50,
    include: {
      auteur: { select: { name: true } },
      serie: { select: { slug: true, titre: true } },
      chapitre: { select: { numero: true, serie: { select: { slug: true, titre: true } } } },
      commentaire: { select: { contenu: true, user: { select: { name: true, pseudo: true } }, chapitre: { select: { numero: true, serie: { select: { slug: true } } } } } },
      critique: { select: { contenu: true, user: { select: { name: true, pseudo: true } }, serie: { select: { slug: true } } } },
      utilisateurCible: { select: { name: true, pseudo: true } },
    },
  });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">
        {t("Moderation.signalements")} <span className="text-base text-texte-doux">({signalements.length})</span>
      </h2>
      {signalements.length === 0 && <p className="text-texte-doux">{t("Moderation.aucunSignalement")}</p>}
      {signalements.map((s) => {
        // Extrait du contenu visé et lien pour l'ouvrir dans son contexte.
        const texte = s.commentaire?.contenu ?? s.critique?.contenu ?? null;
        const auteurVise = s.commentaire?.user ?? s.critique?.user ?? s.utilisateurCible;
        const slug = s.serie?.slug ?? s.chapitre?.serie.slug ?? s.commentaire?.chapitre.serie.slug ?? s.critique?.serie.slug;
        const numero = s.chapitre?.numero ?? s.commentaire?.chapitre.numero;
        const titre = s.serie?.titre ?? (s.chapitre ? `${s.chapitre.serie.titre} — ${s.chapitre.numero}` : null);
        return (
          <Carte key={s.id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge ton="accent">{t(`Moderation.cibles.${s.cible}`)}</Badge>
              <Badge ton="alerte">{t(`Communaute.motifs.${s.motif}`)}</Badge>
              <span className="text-texte-doux">
                {t("Moderation.signalePar", { nom: s.auteur?.name ?? t("Moderation.visiteur") })} · {format.dateTime(s.creeLe, { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
            {titre && <p className="font-semibold">{titre}</p>}
            {auteurVise && (
              <p className="text-sm">
                {auteurVise.name} <span className="text-texte-doux">@{auteurVise.pseudo}</span>
              </p>
            )}
            {texte && <blockquote className="rounded-xl bg-surface-2 p-3 text-sm whitespace-pre-line">{texte.slice(0, 600)}</blockquote>}
            {s.details && <p className="text-sm text-texte-doux">« {s.details} »</p>}
            {!titre && !texte && !auteurVise && <p className="text-sm text-texte-doux">{t("Moderation.contenuSupprime")}</p>}
            {slug &&
              (numero ? (
                <Link href={{ pathname: "/lire/[slug]/[numero]", params: { slug, numero: numero.toString() } }} className="self-start text-sm font-semibold text-accent hover:underline">
                  {t("Moderation.voir")}
                </Link>
              ) : (
                <Link href={{ pathname: "/serie/[slug]", params: { slug } }} className="self-start text-sm font-semibold text-accent hover:underline">
                  {t("Moderation.voir")}
                </Link>
              ))}
            <DecisionSignalement
              signalementId={s.id}
              suspensionPossible={Boolean(auteurVise)}
              libelles={{ note: t("Moderation.commentaireDecision"), rejeter: t("Moderation.rejeter"), retirer: t("Moderation.retirer"), suspendre: t("Moderation.suspendre") }}
            />
          </Carte>
        );
      })}
    </section>
  );
}
