import { describe, expect, it } from "vitest";
import { normaliserPseudo, pseudoDepuis, trouverPseudoLibre, validerPseudo } from "@/lib/pseudo";

describe("normaliserPseudo", () => {
  it("retire les espaces autour et met en minuscules", () => {
    expect(normaliserPseudo("  Lectrice_42 ")).toBe("lectrice_42");
  });
});

describe("validerPseudo", () => {
  it("accepte lettres, chiffres et tiret bas", () => {
    expect(validerPseudo("lectrice_42")).toBeNull();
  });

  it("refuse un pseudo trop court ou trop long", () => {
    expect(validerPseudo("ab")).toBe("TROP_COURT");
    expect(validerPseudo("a".repeat(21))).toBe("TROP_LONG");
  });

  it("refuse les accents, espaces et symboles", () => {
    expect(validerPseudo("élodie")).toBe("CARACTERES_INVALIDES");
    expect(validerPseudo("jean dupont")).toBe("CARACTERES_INVALIDES");
    expect(validerPseudo("jean-dupont")).toBe("CARACTERES_INVALIDES");
  });

  it("refuse les pseudos réservés", () => {
    expect(validerPseudo("admin")).toBe("RESERVE");
    expect(validerPseudo("moderation")).toBe("RESERVE");
  });
});

describe("pseudoDepuis", () => {
  it("dérive un pseudo valide d'un nom accentué", () => {
    const pseudo = pseudoDepuis("Élodie Durand-Martin");
    expect(pseudo).toBe("elodie_durand_m");
    expect(validerPseudo(pseudo)).toBeNull();
  });

  it("utilise la partie locale d'une adresse email", () => {
    expect(pseudoDepuis("camille.roy@example.com")).toBe("camille_roy");
  });

  it("se rabat sur « lecteur » si la source est inutilisable ou réservée", () => {
    expect(pseudoDepuis("日本")).toBe("lecteur");
    expect(pseudoDepuis("Admin")).toBe("lecteur");
  });
});

describe("trouverPseudoLibre", () => {
  it("garde la base si elle est libre", async () => {
    expect(await trouverPseudoLibre("camille", async () => false)).toBe("camille");
  });

  it("ajoute un suffixe si la base est prise, et le résultat reste valide", async () => {
    const pris = new Set(["camille"]);
    const pseudo = await trouverPseudoLibre("camille", async (candidat) => pris.has(candidat));
    expect(pseudo).toMatch(/^camille_\d{4}$/);
    expect(validerPseudo(pseudo)).toBeNull();
  });

  it("reste valide même si tous les suffixes aléatoires sont pris", async () => {
    const pseudo = await trouverPseudoLibre("elodie_durand_m", async () => true);
    expect(validerPseudo(pseudo)).toBeNull();
  });
});
