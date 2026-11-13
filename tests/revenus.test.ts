import { describe, expect, it } from "vitest";
import { celluleCsv, debutDuMois, ibanValide, moisSuivant, repartir } from "@/lib/revenus";

const somme = (parts: { montantCentimes: number }[]) => parts.reduce((s, p) => s + p.montantCentimes, 0);

describe("repartir", () => {
  it("répartit en proportion des vues", () => {
    const parts = repartir(100_000, 50, [{ equipeId: "a", nbVues: 300 }, { equipeId: "b", nbVues: 100 }]);
    expect(parts).toEqual([{ equipeId: "a", nbVues: 300, montantCentimes: 37_500 }, { equipeId: "b", nbVues: 100, montantCentimes: 12_500 }]);
  });

  it("la somme des parts est exactement la somme à répartir, au centime près", () => {
    const parts = repartir(100_000, 50, [{ equipeId: "a", nbVues: 1 }, { equipeId: "b", nbVues: 1 }, { equipeId: "c", nbVues: 1 }]);
    expect(somme(parts)).toBe(50_000);
    expect(parts.map((p) => p.montantCentimes).sort()).toEqual([16_666, 16_667, 16_667]);
  });

  it("donne le même résultat quel que soit l'ordre des équipes", () => {
    const equipes = [{ equipeId: "a", nbVues: 7 }, { equipeId: "b", nbVues: 7 }, { equipeId: "c", nbVues: 3 }];
    const tri = (parts: { equipeId: string }[]) => [...parts].sort((x, y) => x.equipeId.localeCompare(y.equipeId));
    expect(tri(repartir(9_999, 33.33, equipes))).toEqual(tri(repartir(9_999, 33.33, [...equipes].reverse())));
  });

  it("accepte un pourcentage décimal sans erreur d'arrondi", () => {
    expect(somme(repartir(200_000, 12.5, [{ equipeId: "a", nbVues: 5 }, { equipeId: "b", nbVues: 3 }]))).toBe(25_000);
  });

  it("ignore les équipes sans vue et gère l'absence totale de vues", () => {
    expect(repartir(100_000, 50, [{ equipeId: "a", nbVues: 0 }])).toEqual([]);
    expect(repartir(0, 50, [{ equipeId: "a", nbVues: 10 }])).toEqual([{ equipeId: "a", nbVues: 10, montantCentimes: 0 }]);
  });

  it("ne dépasse jamais le revenu, même à 100 %", () => {
    const parts = repartir(1_001, 100, [{ equipeId: "a", nbVues: 2 }, { equipeId: "b", nbVues: 1 }]);
    expect(somme(parts)).toBe(1_001);
  });
});

describe("mois", () => {
  it("lit un mois valide et calcule le suivant, y compris en fin d'année", () => {
    expect(debutDuMois("2026-12")?.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(moisSuivant(debutDuMois("2026-12")!).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("refuse un mois mal formé", () => {
    expect(debutDuMois("2026-13")).toBeNull();
    expect(debutDuMois("décembre")).toBeNull();
  });
});

describe("ibanValide", () => {
  it("accepte des IBAN d'exemple valides, avec ou sans espaces", () => {
    expect(ibanValide("FR76 3000 6000 0112 3456 7890 189")).toBe(true);
    expect(ibanValide("DE89370400440532013000")).toBe(true);
  });

  it("refuse une clé de contrôle fausse ou une forme invalide", () => {
    expect(ibanValide("FR76 3000 6000 0112 3456 7890 188")).toBe(false);
    expect(ibanValide("pas un iban")).toBe(false);
    expect(ibanValide("")).toBe(false);
  });
});

describe("celluleCsv", () => {
  it("entoure de guillemets les valeurs contenant un séparateur", () => {
    expect(celluleCsv('Studio "Brume"; Paris')).toBe('"Studio ""Brume""; Paris"');
  });

  it("neutralise les débuts de formule de tableur", () => {
    expect(celluleCsv("=SOMME(A1:A9)")).toBe("'=SOMME(A1:A9)");
    expect(celluleCsv("@equipe")).toBe("'@equipe");
  });
});
