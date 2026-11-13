import { describe, expect, it } from "vitest";
import { calculerCoupes, meilleureCoupe } from "@/lib/images/decoupage";
import { comparerNaturel, enSlug } from "@/lib/texte";

/** Profil d'une bande : 0 sur les gouttières (lignes unies), 200 dans les cases. */
function profil(hauteur: number, gouttieres: [number, number][]): number[] {
  return Array.from({ length: hauteur }, (_, y) => (gouttieres.some(([debut, fin]) => y >= debut && y < fin) ? 0 : 200));
}

describe("meilleureCoupe", () => {
  it("choisit une ligne unie proche de la coupe idéale", () => {
    const lignes = profil(1000, [[480, 520]]);
    const coupe = meilleureCoupe(lignes, 450, 100);
    expect(coupe).toBeGreaterThanOrEqual(480);
    expect(coupe).toBeLessThan(520);
  });

  it("reste sur la coupe idéale si aucune gouttière n'est à portée", () => {
    expect(meilleureCoupe(profil(1000, []), 450, 100)).toBe(450);
  });
});

describe("calculerCoupes", () => {
  it("ne coupe pas une planche de proportions normales", () => {
    expect(calculerCoupes(800, 1200, profil(1200, []))).toEqual([]);
  });

  it("coupe une longue bande dans ses gouttières", () => {
    // 5 cases de 1100 px séparées par des gouttières de 100 px (bande de 800 × 6000)
    const gouttieres: [number, number][] = [[1150, 1250], [2350, 2450], [3550, 3650], [4750, 4850]];
    const coupes = calculerCoupes(800, 6000, profil(6000, gouttieres));
    expect(coupes.length).toBeGreaterThanOrEqual(3);
    for (const coupe of coupes) {
      expect(gouttieres.some(([debut, fin]) => coupe >= debut && coupe < fin)).toBe(true);
    }
  });

  it("produit des segments de hauteur raisonnable, sans reste minuscule", () => {
    const hauteur = 20_000;
    const bornes = [0, ...calculerCoupes(800, hauteur, profil(hauteur, [])), hauteur];
    const segments = bornes.slice(1).map((borne, i) => borne - bornes[i]!);
    expect(Math.max(...segments)).toBeLessThanOrEqual(800 * 2.6);
    expect(Math.min(...segments)).toBeGreaterThan(800 * 0.5);
  });
});

describe("texte", () => {
  it("enSlug retire accents, ponctuation et espaces", () => {
    expect(enSlug("Les Veilleurs de brume")).toBe("les-veilleurs-de-brume");
    expect(enSlug("  Zéro Faute !  ")).toBe("zero-faute");
    expect(enSlug("日本語")).toBe("");
  });

  it("comparerNaturel trie page2 avant page10", () => {
    expect(["p10.png", "p2.png", "p1.png"].sort(comparerNaturel)).toEqual(["p1.png", "p2.png", "p10.png"]);
  });
});
