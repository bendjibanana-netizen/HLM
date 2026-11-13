"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { Message } from "@/components/ui/message";
import { useRouter } from "@/i18n/navigation";
import { comparerNaturel } from "@/lib/texte";
import { creerChapitre, envoyerChapitre } from "@/server/actions/chapitres";

type Planche = { id: string; fichier: File; apercu: string };
type Suite = "BROUILLON" | "PUBLIER" | "PROGRAMMER";

const EXTENSIONS_IMAGE = /\.(jpe?g|png|webp|avif|gif)$/i;
const TYPES_MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif" };

/** Extrait les images d'un fichier ZIP dans le navigateur, triées par nom (page2 avant page10). */
async function imagesDuZip(zip: File): Promise<File[]> {
  const { unzip } = await import("fflate");
  const contenu = new Uint8Array(await zip.arrayBuffer());
  const entrees = await new Promise<Record<string, Uint8Array>>((resoudre, rejeter) =>
    // Seuls les fichiers image sont décompressés ; les dossiers système (__MACOSX) sont ignorés.
    unzip(contenu, { filter: (fichier) => EXTENSIONS_IMAGE.test(fichier.name) && !fichier.name.startsWith("__MACOSX") }, (erreur, donnees) => (erreur ? rejeter(erreur) : resoudre(donnees))),
  );
  return Object.keys(entrees)
    .sort(comparerNaturel)
    .map((nom) => {
      const extension = nom.split(".").pop()!.toLowerCase();
      return new File([entrees[nom]! as BlobPart], nom.split("/").pop()!, { type: TYPES_MIME[extension] });
    });
}

function Vignette({ planche, numero, onRetirer, libelles }: { planche: Planche; numero: number; onRetirer: () => void; libelles: { deplacer: string; retirer: string } }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: planche.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`relative ${isDragging ? "z-10 opacity-80" : ""}`}>
      {/* touch-none : sur mobile, le geste déplace la planche au lieu de faire défiler la page */}
      <button type="button" {...attributes} {...listeners} aria-label={libelles.deplacer} className="block w-full cursor-grab touch-none overflow-hidden rounded-lg border border-bordure bg-surface-2 active:cursor-grabbing">
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un fichier pas encore envoyé */}
        <img src={planche.apercu} alt="" className="aspect-2/3 w-full object-cover object-top" draggable={false} />
        <span className="absolute bottom-1 left-1 rounded-md bg-fond/90 px-1.5 text-xs font-bold tabular-nums">{numero}</span>
      </button>
      <button type="button" onClick={onRetirer} aria-label={libelles.retirer} className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border border-bordure bg-surface text-texte-doux shadow-sm hover:text-danger">
        <X className="size-4" aria-hidden />
      </button>
    </li>
  );
}

/** Création d'un chapitre : numéro, planches à ordonner par glisser-déposer, puis envoi. */
export function EnvoiChapitre({ serieId, numeroPropose }: { serieId: string; numeroPropose: string }) {
  const t = useTranslations("Equipe.chapitre");
  const routeur = useRouter();
  const [planches, setPlanches] = useState<Planche[]>([]);
  const [suite, setSuite] = useState<Suite>("PUBLIER");
  const [etat, setEtat] = useState<{ message?: string; erreur?: string; enCours: boolean }>({ enCours: false });
  const compteur = useRef(0);
  const capteurs = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Appui maintenu avant déplacement : un simple défilement du doigt ne déplace rien.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Libère les aperçus en mémoire quand l'écran est quitté.
  const courantes = useRef<Planche[]>([]);
  useEffect(() => {
    courantes.current = planches;
  }, [planches]);
  useEffect(() => () => courantes.current.forEach((planche) => URL.revokeObjectURL(planche.apercu)), []);

  async function ajouter(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    setEtat({ enCours: false });
    const images: File[] = [];
    for (const fichier of [...fichiers].sort((a, b) => comparerNaturel(a.name, b.name))) {
      if (/\.zip$/i.test(fichier.name) || fichier.type === "application/zip") {
        setEtat({ enCours: false, message: t("lecture") });
        const extraites = await imagesDuZip(fichier).catch(() => []);
        if (extraites.length === 0) return setEtat({ enCours: false, erreur: t("erreurs.ZIP_VIDE") });
        images.push(...extraites);
      } else if (fichier.type.startsWith("image/")) {
        images.push(fichier);
      }
    }
    setEtat({ enCours: false });
    setPlanches((actuelles) => [...actuelles, ...images.map((fichier) => ({ id: `p${compteur.current++}`, fichier, apercu: URL.createObjectURL(fichier) }))].slice(0, 300));
  }

  function surDepot({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setPlanches((actuelles) => arrayMove(actuelles, actuelles.findIndex((p) => p.id === active.id), actuelles.findIndex((p) => p.id === over.id)));
  }

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const f = new FormData(evenement.currentTarget);
    if (planches.length === 0) return setEtat({ enCours: false, erreur: t("erreurs.AUCUNE_PLANCHE") });
    const date = String(f.get("programmePour") ?? "");
    if (suite === "PROGRAMMER" && (!date || new Date(date).getTime() < Date.now() + 60_000)) return setEtat({ enCours: false, erreur: t("erreurs.DATE_INVALIDE") });

    setEtat({ enCours: true });
    const erreur = (code: string, nom = "") => setEtat({ enCours: false, erreur: t.has(`erreurs.${code}`) ? t(`erreurs.${code}`, { nom }) : t("erreurs.DEFAUT") });

    const chapitre = await creerChapitre({ serieId, numero: String(f.get("numero")).trim().replace(",", "."), titre: String(f.get("titre") ?? "") }).catch(() => null);
    if (!chapitre?.ok) return erreur(chapitre?.erreur ?? "DEFAUT");

    // Les planches partent une par une : la progression est visible et un échec n'oblige pas à tout renvoyer.
    const ordre: string[] = [];
    for (const [index, planche] of planches.entries()) {
      setEtat({ enCours: true, message: t("envoi", { courant: index + 1, total: planches.length }) });
      const corps = new FormData();
      corps.set("type", "page");
      corps.set("chapitreId", chapitre.id);
      corps.set("fichier", planche.fichier);
      const reponse = await fetch("/api/equipe/televersement", { method: "POST", body: corps }).catch(() => null);
      const donnees = (await reponse?.json().catch(() => null)) as { id?: string; erreur?: string } | null;
      if (!reponse?.ok || !donnees?.id) return erreur(donnees?.erreur ?? "DEFAUT", planche.fichier.name);
      ordre.push(donnees.id);
    }

    const envoi = await envoyerChapitre({ chapitreId: chapitre.id, ordre, suite, programmePour: suite === "PROGRAMMER" ? new Date(date).toISOString() : undefined }).catch(() => null);
    if (!envoi?.ok) return erreur(envoi?.erreur ?? "DEFAUT");
    routeur.push({ pathname: "/equipe/series/[id]", params: { id: serieId } });
  }

  const suites: { valeur: Suite; libelle: string }[] = [
    { valeur: "PUBLIER", libelle: t("publier") },
    { valeur: "PROGRAMMER", libelle: t("programmer") },
    { valeur: "BROUILLON", libelle: t("brouillon") },
  ];

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Champ libelle={t("numero")} name="numero" defaultValue={numeroPropose} aide={t("numeroAide")} inputMode="decimal" pattern="\d{1,5}([.,]\d{1,2})?" required />
        <Champ libelle={t("titreChapitre")} name="titre" maxLength={120} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">
          {t("planches")} {planches.length > 0 && <span className="text-base text-texte-doux">({planches.length})</span>}
        </h2>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-bordure p-6 text-center hover:border-accent has-focus-visible:border-accent">
          <ImagePlus className="size-7 text-texte-doux" aria-hidden />
          <span className="font-semibold">{t("ajouter")}</span>
          <span className="text-sm text-texte-doux">{t("ajouterAide")}</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,.zip,application/zip"
            className="sr-only"
            onChange={(e) => {
              void ajouter(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {planches.length > 0 && (
          <>
            <p className="text-sm text-texte-doux">{t("ordreAide")}</p>
            <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={surDepot}>
              <SortableContext items={planches} strategy={rectSortingStrategy}>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {planches.map((planche, index) => (
                    <Vignette
                      key={planche.id}
                      planche={planche}
                      numero={index + 1}
                      libelles={{ deplacer: t("deplacer", { numero: index + 1 }), retirer: t("retirer", { numero: index + 1 }) }}
                      onRetirer={() => {
                        URL.revokeObjectURL(planche.apercu);
                        setPlanches((actuelles) => actuelles.filter((p) => p.id !== planche.id));
                      }}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </>
        )}
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-bold">{t("suite")}</legend>
        {suites.map(({ valeur, libelle }) => (
          <label key={valeur} className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-bordure px-3 has-checked:border-accent has-checked:bg-accent/10">
            <input type="radio" name="suite" value={valeur} checked={suite === valeur} onChange={() => setSuite(valeur)} className="size-4 accent-(--accent)" />
            {libelle}
          </label>
        ))}
        {suite === "PROGRAMMER" && <Champ libelle={t("date")} name="programmePour" type="datetime-local" required />}
      </fieldset>

      {etat.erreur && <Message ton="erreur">{etat.erreur}</Message>}
      {etat.message && <Message>{etat.message}</Message>}
      <Bouton type="submit" taille="lg" enCours={etat.enCours} className="self-start">
        {t("envoyer")}
      </Bouton>
    </form>
  );
}
