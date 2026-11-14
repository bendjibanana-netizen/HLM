"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, Minimize, Settings2, SkipBack, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as EvenementPointeur } from "react";
import { Commentaires } from "@/components/communaute/commentaires";
import { Signalement } from "@/components/communaute/signalement";
import { Pub } from "@/components/pub/pub";
import { BoutonTelechargement } from "@/components/pwa/bouton-telechargement";
import { Bouton, LienBouton } from "@/components/ui/bouton";
import { Feuille } from "@/components/ui/feuille";
import { Segments } from "@/components/ui/segments";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { useStockage } from "@/lib/use-stockage";

export type PageLecteur = {
  id: string;
  largeur: number;
  hauteur: number;
  avif: string;
  webp: string;
  src: string;
  apercu: string | null;
};

type Proprietes = {
  serie: { slug: string; titre: string; sensLecture: "VERTICAL" | "DROITE_A_GAUCHE" | "GAUCHE_A_DROITE" };
  numero: string;
  /** Identifiant du chapitre et nombre de commentaires ; absents en aperçu avant publication. */
  chapitreId: string | null;
  nbCommentaires: number;
  pages: PageLecteur[];
  /** Numéros des chapitres voisins, ou null aux extrémités. */
  precedent: string | null;
  suivant: string | null;
  /** Premières planches du chapitre suivant, préchargées en fin de lecture. */
  debutSuivant: { avif: string; webp: string }[];
  /** Position enregistrée sur le compte, si ce chapitre est celui en cours. */
  positionServeur: { page: number; ratio: number } | null;
  connecte: boolean;
  /** Jeton signé permettant de compter la vue ; absent en aperçu. */
  jetonVue: string | null;
  /** Publicité de fin de chapitre, si l'emplacement est actif. */
  pub: { code: string | null; libelle: string; mobile: boolean; bureau: boolean } | null;
};

const MODES = ["vertical", "pages"] as const;
const SENS = ["rtl", "ltr"] as const;
const LARGEURS = ["etroite", "moyenne", "large"] as const;
const LARGEUR_PX = { etroite: 560, moyenne: 760, large: 1000 };
const CLASSE_LARGEUR = { etroite: "md:max-w-140", moyenne: "md:max-w-190", large: "md:max-w-250" };

type Position = { numero: string; page: number; ratio: number };

function lirePositionLocale(slug: string, numero: string): Position | null {
  try {
    const position = JSON.parse(localStorage.getItem(`lecture:${slug}`) ?? "null") as Position | null;
    return position?.numero === numero ? position : null;
  } catch {
    return null;
  }
}

/** Une planche : la place est réservée d'avance (pas de saut à l'arrivée de l'image) et l'aperçu flou sert de fond. */
function Planche({ page, sizes, prioritaire, urgente = false, alt, className }: { page: PageLecteur; sizes: string; prioritaire: boolean; urgente?: boolean; alt: string; className?: string }) {
  return (
    <picture>
      <source type="image/avif" srcSet={page.avif} sizes={sizes} />
      <source type="image/webp" srcSet={page.webp} sizes={sizes} />
      { }
      <img
        src={page.src}
        alt={alt}
        width={page.largeur}
        height={page.hauteur}
        loading={prioritaire ? "eager" : "lazy"}
        // Une seule image en priorité haute : la première planche ne partage pas la bande passante.
        fetchPriority={urgente ? "high" : undefined}
        decoding="async"
        draggable={false}
        className={className}
        style={page.apercu ? { backgroundImage: `url(${page.apercu})`, backgroundSize: "cover" } : undefined}
      />
    </picture>
  );
}

const abonnerPleinEcran = (rappel: () => void) => {
  document.addEventListener("fullscreenchange", rappel);
  return () => document.removeEventListener("fullscreenchange", rappel);
};

export function Lecteur({ serie, numero, chapitreId, nbCommentaires, pages, precedent, suivant, debutSuivant, positionServeur, connecte, jetonVue, pub }: Proprietes) {
  const t = useTranslations("Lecteur");
  const total = pages.length;

  // ── Réglages, mémorisés sur l'appareil ──
  const [mode, setMode] = useStockage(`lecteur:mode:${serie.slug}`, serie.sensLecture === "VERTICAL" ? "vertical" : "pages", MODES);
  const [sens, setSens] = useStockage(`lecteur:sens:${serie.slug}`, serie.sensLecture === "GAUCHE_A_DROITE" ? "ltr" : "rtl", SENS);
  const [largeur, setLargeur] = useStockage("lecteur:largeur", "moyenne", LARGEURS);
  const pleinEcran = useSyncExternalStore(abonnerPleinEcran, () => Boolean(document.fullscreenElement), () => false);
  const pleinEcranPossible = useSyncExternalStore(() => () => {}, () => document.fullscreenEnabled, () => false);

  // ── État de lecture ──
  // `index` va de 0 à `total` : la valeur `total` désigne l'écran de fin de chapitre (mode page par page).
  const [index, setIndex] = useState(positionServeur?.page ?? 0);
  const [commandes, setCommandes] = useState(true);
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [precharger, setPrecharger] = useState(false);

  const position = useRef<Position>({ numero, page: positionServeur?.page ?? 0, ratio: positionServeur?.ratio ?? 0 });
  const barre = useRef<HTMLSpanElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Comptage de la vue ──
  // Envoyée une seule fois, après huit secondes de présence : ouvrir un chapitre sans le lire ne compte pas.
  useEffect(() => {
    if (!chapitreId || !jetonVue) return;
    const minuterie = setTimeout(() => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/vues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chapitreId, jeton: jetonVue }), keepalive: true }).catch(() => {});
    }, 8000);
    return () => clearTimeout(minuterie);
  }, [chapitreId, jetonVue]);

  // ── Mémorisation de la position ──
  const enregistrer = useCallback(
    (immediat = false) => {
      const { page, ratio } = position.current;
      try {
        localStorage.setItem(`lecture:${serie.slug}`, JSON.stringify(position.current));
      } catch {
        // Stockage indisponible : seule la position du compte sera conservée.
      }
      if (!connecte) return;
      const corps = JSON.stringify({ slug: serie.slug, numero, page, ratio, termine: ratio > 0.97 || page >= total - 1 });
      if (immediat) {
        // À la fermeture de la page, sendBeacon garantit l'envoi même si l'onglet disparaît.
        navigator.sendBeacon("/api/progression", new Blob([corps], { type: "application/json" }));
      } else {
        void fetch("/api/progression", { method: "POST", headers: { "Content-Type": "application/json" }, body: corps, keepalive: true }).catch(() => {});
      }
    },
    [connecte, numero, serie.slug, total],
  );

  /** Note la nouvelle position et l'enregistre après 1,5 s sans mouvement. */
  const noterPosition = useCallback(
    (page: number, ratio: number) => {
      position.current = { numero, page, ratio };
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(enregistrer, 1500);
    },
    [enregistrer, numero],
  );

  useEffect(() => {
    const surMasquage = () => {
      if (document.visibilityState === "hidden") enregistrer(true);
    };
    document.addEventListener("visibilitychange", surMasquage);
    return () => {
      document.removeEventListener("visibilitychange", surMasquage);
      clearTimeout(minuterie.current);
    };
  }, [enregistrer]);

  // ── Reprise à la position mémorisée (compte, sinon appareil) ──
  useEffect(() => {
    const depart = positionServeur ?? lirePositionLocale(serie.slug, numero);
    if (!depart) return;
    if (mode === "vertical") {
      // La hauteur de chaque planche est réservée d'avance : la position est exacte avant même le chargement des images.
      const hauteur = document.documentElement.scrollHeight - window.innerHeight;
      if (depart.ratio > 0.02) window.scrollTo({ top: depart.ratio * hauteur });
    } else if (depart.page > 0 && depart.page < total) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- la position de l'appareil n'est connue qu'après l'hydratation
      setIndex(depart.page);
    }
    // Volontairement une seule fois, à l'ouverture du chapitre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mode vertical : suivi du défilement ──
  useEffect(() => {
    if (mode !== "vertical") return;
    let dernier = window.scrollY;
    let enAttente = false;

    const surDefilement = () => {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(() => {
        enAttente = false;
        const y = window.scrollY;
        const hauteur = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0, y / hauteur));
        // La barre d'avancement est mise à jour sans re-rendu React : le défilement reste fluide.
        if (barre.current) barre.current.style.transform = `scaleX(${ratio})`;
        // Les commandes s'effacent quand on descend et reviennent quand on remonte ou en bout de chapitre.
        if (y - dernier > 12 && y > 120 && ratio < 0.98) setCommandes(false);
        else if (dernier - y > 12 || ratio >= 0.98) setCommandes(true);
        dernier = y;
        if (ratio > 0.7) setPrecharger(true);
        noterPosition(position.current.page, ratio);
      });
    };
    window.addEventListener("scroll", surDefilement, { passive: true });

    // Planche en cours : celle qui traverse le milieu de l'écran.
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          const page = Number((entree.target as HTMLElement).dataset.page);
          position.current.page = page;
          setIndex(page);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll("[data-page]").forEach((element) => observateur.observe(element));

    return () => {
      window.removeEventListener("scroll", surDefilement);
      observateur.disconnect();
    };
  }, [mode, noterPosition]);

  // ── Mode page par page : navigation ──
  const allerA = useCallback(
    (cible: number) => {
      const page = Math.max(0, Math.min(total, cible));
      setIndex(page);
      setCommandes(page === total);
      if (page >= total - 2) setPrecharger(true);
      noterPosition(Math.min(page, total - 1), total > 1 ? Math.min(page, total - 1) / (total - 1) : 1);
    },
    [noterPosition, total],
  );

  useEffect(() => {
    if (mode !== "pages") return;
    const surTouche = (evenement: KeyboardEvent) => {
      if (reglagesOuverts) return;
      // En lecture droite → gauche, la flèche gauche fait avancer.
      const avance = sens === "rtl" ? "ArrowLeft" : "ArrowRight";
      const recule = sens === "rtl" ? "ArrowRight" : "ArrowLeft";
      if (evenement.key === avance || evenement.key === " " || evenement.key === "PageDown") {
        evenement.preventDefault();
        allerA(index + 1);
      } else if (evenement.key === recule || evenement.key === "PageUp") {
        evenement.preventDefault();
        allerA(index - 1);
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [allerA, index, mode, reglagesOuverts, sens]);

  // Gestes tactiles : glisser pour tourner la page, toucher un bord pour avancer ou reculer, le centre pour les commandes.
  const depart = useRef<{ x: number; y: number } | null>(null);
  const surAppui = (evenement: EvenementPointeur) => {
    depart.current = { x: evenement.clientX, y: evenement.clientY };
  };
  const surRelachement = (evenement: EvenementPointeur) => {
    if (!depart.current) return;
    const dx = evenement.clientX - depart.current.x;
    const dy = evenement.clientY - depart.current.y;
    depart.current = null;
    const versLaSuite = sens === "rtl" ? 1 : -1; // signe du mouvement horizontal qui fait avancer

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      // Glissement : la page suit le doigt, comme du papier.
      allerA(index + (Math.sign(dx) === versLaSuite ? 1 : -1));
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const zone = evenement.clientX / window.innerWidth;
      if (zone < 0.3) allerA(index + (sens === "rtl" ? 1 : -1));
      else if (zone > 0.7) allerA(index + (sens === "rtl" ? -1 : 1));
      else setCommandes((visible) => !visible);
    }
  };

  const basculerPleinEcran = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };

  const lienChapitre = (cible: string) => ({ pathname: "/lire/[slug]/[numero]" as const, params: { slug: serie.slug, numero: cible } });
  const lienSerie = { pathname: "/serie/[slug]" as const, params: { slug: serie.slug } };
  const sizesVertical = `(min-width: 768px) ${LARGEUR_PX[largeur]}px, 100vw`;
  const sizesPages = "(min-width: 1024px) 60vw, 100vw";
  const pageAffichee = Math.min(index + 1, total);

  const finDeChapitre = (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 px-4 py-12 text-center">
      <p className="font-titre text-2xl font-extrabold">{t("fin", { numero })}</p>
      {/* Publicité entre deux chapitres : après la dernière planche, jamais au milieu. */}
      {pub && <Pub {...pub} />}
      {suivant ? (
        <LienBouton href={lienChapitre(suivant)} taille="lg" pleineLargeur>
          {t("suivant")} · {suivant}
        </LienBouton>
      ) : (
        <p className="text-texte-doux">{t("finSerie")}</p>
      )}
      <LienBouton href={lienSerie} variante="secondaire" pleineLargeur>
        {t("retour")}
      </LienBouton>
      {chapitreId && (
        <>
          <div className="mt-4 w-full">
            <Commentaires chapitreId={chapitreId} nombre={nbCommentaires} />
          </div>
          <Signalement cible="CHAPITRE" id={chapitreId} discret />
        </>
      )}
    </div>
  );

  return (
    // Le lecteur est toujours sombre : les planches ressortent et l'écran fatigue moins les yeux.
    <div className={cn("theme-sombre min-h-dvh bg-fond text-texte", mode === "pages" && "fixed inset-0 overflow-hidden bg-black")}>
      {/* ── Barre du haut ── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 flex h-entete items-center gap-1 border-b border-bordure bg-fond/95 px-2 backdrop-blur transition-transform duration-200",
          !commandes && "-translate-y-full",
        )}
      >
        <Link href={lienSerie} aria-label={t("retour")} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{serie.titre}</p>
          <h1 className="truncate font-sans text-xs tracking-normal text-texte-doux">{t("chapitre", { numero })}</h1>
        </div>
        <button
          type="button"
          onClick={() => setReglagesOuverts(true)}
          aria-label={t("reglages")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
        >
          <Settings2 className="size-5" aria-hidden />
        </button>
      </header>

      {/* ── Planches ── */}
      {mode === "vertical" ? (
        <main className="pt-entete pb-24" onClick={() => setCommandes((visible) => !visible)}>
          <div className={cn("mx-auto flex w-full flex-col", CLASSE_LARGEUR[largeur])}>
            {pages.map((page, i) => (
              <div key={page.id} data-page={i} style={{ aspectRatio: `${page.largeur} / ${page.hauteur}` }}>
                <Planche page={page} sizes={sizesVertical} prioritaire={i < 2} urgente={i === 0} alt={t("planche", { page: i + 1 })} className="size-full select-none" />
              </div>
            ))}
          </div>
          <div onClick={(evenement) => evenement.stopPropagation()}>{finDeChapitre}</div>
        </main>
      ) : (
        <main className="absolute inset-0 touch-pan-y select-none" onPointerDown={surAppui} onPointerUp={surRelachement}>
          {index >= total ? (
            <div className="h-full overflow-y-auto pt-entete pb-20 select-text" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
              {finDeChapitre}
            </div>
          ) : (
            // La planche en cours et ses voisines sont dans la page : tourner est instantané.
            pages.map((page, i) =>
              Math.abs(i - index) <= 1 || i === index + 2 ? (
                <div key={page.id} className={cn("absolute inset-0 flex items-center justify-center", i !== index && "invisible")}>
                  <Planche page={page} sizes={sizesPages} prioritaire urgente={i === index} alt={t("planche", { page: i + 1 })} className="max-h-full max-w-full object-contain" />
                </div>
              ) : null,
            )
          )}
        </main>
      )}

      {/* Préchargement discret du début du chapitre suivant */}
      {precharger &&
        debutSuivant.map((page, i) => (
          <picture key={i} className="hidden">
            <source type="image/avif" srcSet={page.avif} sizes={mode === "vertical" ? sizesVertical : sizesPages} />
            <source type="image/webp" srcSet={page.webp} sizes={mode === "vertical" ? sizesVertical : sizesPages} />
            { }
            <img alt="" />
          </picture>
        ))}

      {/* ── Barre du bas ── */}
      <footer
        className={cn(
          "pb-securite fixed inset-x-0 bottom-0 z-30 border-t border-bordure bg-fond/95 backdrop-blur transition-transform duration-200",
          !commandes && "translate-y-full",
        )}
      >
        {mode === "vertical" && (
          <span className="absolute inset-x-0 -top-0.5 block h-0.5 bg-surface-2" aria-hidden>
            <span ref={barre} className="block h-full origin-left scale-x-0 bg-accent" />
          </span>
        )}
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-1 px-2">
          {precedent ? (
            <Link href={lienChapitre(precedent)} aria-label={t("precedent")} className="flex size-11 items-center justify-center rounded-full hover:bg-surface-2">
              <SkipBack className="size-5" aria-hidden />
            </Link>
          ) : (
            <span className="size-11" />
          )}
          {mode === "pages" && (
            <button
              type="button"
              onClick={() => allerA(index + (sens === "rtl" ? 1 : -1))}
              aria-label={sens === "rtl" ? t("pageSuivante") : t("pagePrecedente")}
              className="flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          )}
          <p className="min-w-16 text-center text-sm font-semibold tabular-nums" aria-live="polite">
            {t("page", { page: pageAffichee, total })}
          </p>
          {mode === "pages" && (
            <button
              type="button"
              onClick={() => allerA(index + (sens === "rtl" ? -1 : 1))}
              aria-label={sens === "rtl" ? t("pagePrecedente") : t("pageSuivante")}
              className="flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          )}
          {suivant ? (
            <Link href={lienChapitre(suivant)} aria-label={t("suivant")} className="flex size-11 items-center justify-center rounded-full hover:bg-surface-2">
              <SkipForward className="size-5" aria-hidden />
            </Link>
          ) : (
            <span className="size-11" />
          )}
        </div>
      </footer>

      {/* ── Réglages ── */}
      <Feuille ouverte={reglagesOuverts} onFermer={() => setReglagesOuverts(false)} titre={t("reglages")} libelleFermer={t("fermer")}>
        <div className="flex flex-col gap-5">
          <Segments
            libelle={t("mode")}
            valeur={mode}
            onChange={setMode}
            options={[
              { valeur: "vertical", libelle: t("modeVertical") },
              { valeur: "pages", libelle: t("modePages") },
            ]}
          />
          {mode === "pages" && (
            <Segments
              libelle={t("sens")}
              valeur={sens}
              onChange={setSens}
              options={[
                { valeur: "rtl", libelle: t("sensRtl") },
                { valeur: "ltr", libelle: t("sensLtr") },
              ]}
            />
          )}
          {/* La largeur ne se règle que sur grand écran : sur téléphone, les planches occupent tout l'écran. */}
          {mode === "vertical" && (
            <div className="hidden md:block">
              <Segments
                libelle={t("largeur")}
                valeur={largeur}
                onChange={setLargeur}
                options={LARGEURS.map((valeur) => ({ valeur, libelle: t(valeur) }))}
              />
            </div>
          )}
          {pleinEcranPossible && (
            <Bouton variante="secondaire" pleineLargeur onClick={basculerPleinEcran}>
              {pleinEcran ? <Minimize className="size-4" aria-hidden /> : <Maximize className="size-4" aria-hidden />}
              {pleinEcran ? t("quitterPleinEcran") : t("pleinEcran")}
            </Bouton>
          )}
          {/* Hors-ligne : la déclinaison de largeur moyenne de chaque planche, lisible sur téléphone comme sur tablette. */}
          <BoutonTelechargement serie={serie.titre} numero={numero} images={pages.map((page) => page.src)} />
          {mode === "pages" && <p className="text-sm text-texte-doux">{t("aide")}</p>}
        </div>
      </Feuille>
    </div>
  );
}
