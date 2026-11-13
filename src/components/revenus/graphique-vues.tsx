"use client";

import { useState } from "react";

type Point = { jour: string; libelle: string; vues: number };

/**
 * Histogramme des vues par jour. Une seule série, donc une seule teinte et pas de légende :
 * le titre de la section dit ce qui est mesuré. Chaque barre a une infobulle au survol ou au toucher,
 * et les mêmes chiffres sont disponibles en tableau juste en dessous.
 */
export function GraphiqueVues({ points, libelleVues, libelleTableau, colonnes }: { points: Point[]; libelleVues: (n: number) => string; libelleTableau: string; colonnes: [string, string] }) {
  const [actif, setActif] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.vues));
  // Graduations « rondes » : 0, moitié, maximum arrondi au-dessus.
  const pas = Math.pow(10, Math.floor(Math.log10(max)));
  const haut = Math.ceil(max / pas) * pas;
  const [L, H, bas, gauche] = [600, 180, 22, 34];
  const largeur = (L - gauche) / points.length;
  const y = (vues: number) => (H - bas) * (1 - vues / haut);

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
        <svg viewBox={`0 0 ${L} ${H}`} className="w-full" role="img" aria-label={libelleTableau} onPointerLeave={() => setActif(null)}>
          {/* Grille discrète : trois lignes horizontales et leurs valeurs */}
          {[0, haut / 2, haut].map((valeur) => (
            <g key={valeur}>
              <line x1={gauche} x2={L} y1={y(valeur)} y2={y(valeur)} className="stroke-bordure" strokeWidth={1} />
              <text x={gauche - 6} y={y(valeur) + 4} textAnchor="end" className="fill-texte-doux text-[11px]">{valeur}</text>
            </g>
          ))}
          {points.map((point, i) => {
            const x = gauche + i * largeur;
            const hauteur = Math.max(point.vues > 0 ? 2 : 0, H - bas - y(point.vues));
            return (
              <g key={point.jour}>
                {/* Barre fine, sommet arrondi, espacée de 2 px de ses voisines */}
                <rect x={x + 1} y={H - bas - hauteur} width={Math.max(2, largeur - 2)} height={hauteur} rx={Math.min(4, largeur / 3)} className={actif === i ? "fill-texte" : "fill-accent"} />
                {/* Zone de survol plus large que la barre : toute la colonne */}
                <rect x={x} y={0} width={largeur} height={H - bas} fill="transparent" onPointerEnter={() => setActif(i)} onPointerDown={() => setActif(i)} />
                {(i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2)) && (
                  <text x={x + largeur / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-texte-doux text-[11px]">{point.libelle}</text>
                )}
              </g>
            );
          })}
        </svg>
        {actif !== null && (
          <p className="pointer-events-none absolute top-0 rounded-lg border border-bordure bg-surface px-2.5 py-1.5 text-sm shadow-lg" style={{ left: `${Math.min(70, Math.max(0, ((gauche + actif * largeur) / L) * 100 - 8))}%` }} role="status">
            <span className="block font-bold tabular-nums">{libelleVues(points[actif]!.vues)}</span>
            <span className="text-texte-doux">{points[actif]!.libelle}</span>
          </p>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-texte-doux hover:text-texte">{libelleTableau}</summary>
        <table className="mt-2 w-full max-w-xs tabular-nums">
          <thead>
            <tr className="text-left text-texte-doux"><th className="py-1 font-semibold">{colonnes[0]}</th><th className="py-1 text-right font-semibold">{colonnes[1]}</th></tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.jour} className="border-t border-bordure"><td className="py-1">{point.libelle}</td><td className="py-1 text-right">{point.vues}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
