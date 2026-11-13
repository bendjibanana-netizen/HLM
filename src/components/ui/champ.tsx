"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ProprietesChamp = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  libelle: string;
  /** Texte d'aide affiché sous le champ. */
  aide?: ReactNode;
  /** Message d'erreur : remplace l'aide et marque le champ comme invalide. */
  erreur?: ReactNode;
  /** Élément placé à droite, à l'intérieur du champ (ex. bouton « afficher »). */
  suffixe?: ReactNode;
};

const CLASSES_SAISIE =
  "h-12 w-full rounded-xl border border-bordure bg-surface px-3.5 text-texte transition placeholder:text-texte-doux/70 " +
  "hover:border-texte-doux focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/30";

/** Champ de formulaire : libellé, saisie, aide et erreur reliés pour les lecteurs d'écran. */
export function Champ({ libelle, aide, erreur, suffixe, className, ...proprietes }: ProprietesChamp) {
  const id = useId();
  const idDescription = `${id}-description`;
  const description = erreur ?? aide;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {libelle}
      </label>
      <div className="relative">
        <input
          id={id}
          className={cn(CLASSES_SAISIE, suffixe && "pr-12", className)}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={description ? idDescription : undefined}
          {...proprietes}
        />
        {suffixe && <div className="absolute inset-y-0 right-1 flex items-center">{suffixe}</div>}
      </div>
      {description && (
        <p id={idDescription} className={cn("text-sm", erreur ? "text-danger" : "text-texte-doux")}>
          {description}
        </p>
      )}
    </div>
  );
}

type ProprietesMotDePasse = Omit<ProprietesChamp, "type" | "suffixe"> & {
  libelleAfficher: string;
  libelleMasquer: string;
};

/** Champ mot de passe avec bouton pour afficher ou masquer la saisie. */
export function ChampMotDePasse({ libelleAfficher, libelleMasquer, ...proprietes }: ProprietesMotDePasse) {
  const [visible, setVisible] = useState(false);
  const Icone = visible ? EyeOff : Eye;

  return (
    <Champ
      type={visible ? "text" : "password"}
      suffixe={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex size-10 items-center justify-center rounded-lg text-texte-doux hover:text-texte"
          aria-label={visible ? libelleMasquer : libelleAfficher}
          aria-pressed={visible}
        >
          <Icone className="size-5" aria-hidden />
        </button>
      }
      {...proprietes}
    />
  );
}
