"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type Option<V extends string> = { valeur: V; libelle: string };

/** Sélecteur à choix unique présenté en segments (thème, langue…). */
export function Segments<V extends string>({
  libelle,
  options,
  valeur,
  onChange,
}: {
  libelle: string;
  options: Option<V>[];
  valeur: V | null;
  onChange: (valeur: V) => void;
}) {
  const nom = useId();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{libelle}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-2 p-1">
        {options.map((option) => (
          <label
            key={option.valeur}
            className={cn(
              "flex h-10 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold transition",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
              valeur === option.valeur ? "bg-surface text-texte shadow-sm" : "text-texte-doux hover:text-texte",
            )}
          >
            <input
              type="radio"
              name={nom}
              value={option.valeur}
              checked={valeur === option.valeur}
              onChange={() => onChange(option.valeur)}
              className="sr-only"
            />
            {option.libelle}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
