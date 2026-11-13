import { describe, expect, it } from "vitest";
import { construireFiltre, lireCriteres } from "@/lib/recherche/criteres";

describe("lireCriteres", () => {
  it("sans paramètre : tendances, première page, aucun filtre", () => {
    const criteres = lireCriteres({});
    expect(criteres).toMatchObject({ requete: "", tri: "tendances", page: 1, noteMin: 0, types: [], genres: [] });
  });

  it("avec une recherche, le tri par défaut est la pertinence", () => {
    expect(lireCriteres({ q: "  brume " })).toMatchObject({ requete: "brume", tri: "pertinence" });
  });

  it("accepte les valeurs répétées et écarte les valeurs inconnues", () => {
    const criteres = lireCriteres({ type: ["MANGA", "WEBTOON", "ROMAN"], langue: "EN", statut: "N'IMPORTE" });
    expect(criteres.types).toEqual(["MANGA", "WEBTOON"]);
    expect(criteres.langues).toEqual(["EN"]);
    expect(criteres.statuts).toEqual([]);
  });

  it("ne laisse passer aucune tentative d'injection dans le filtre", () => {
    const criteres = lireCriteres({ type: '" OR 1=1', genre: ['sport" OR genres EXISTS', "tranche-de-vie"] });
    expect(criteres.types).toEqual([]);
    expect(criteres.genres).toEqual(["tranche-de-vie"]);
  });

  it("borne la note, la page et la longueur de la recherche", () => {
    expect(lireCriteres({ note: "42" }).noteMin).toBe(10);
    expect(lireCriteres({ note: "abc" }).noteMin).toBe(0);
    expect(lireCriteres({ page: "-3" }).page).toBe(1);
    expect(lireCriteres({ page: "999999" }).page).toBe(1);
    expect(lireCriteres({ q: "a".repeat(500) }).requete).toHaveLength(100);
  });

  it("ignore un tri inconnu", () => {
    expect(lireCriteres({ tri: "hasard" }).tri).toBe("tendances");
  });
});

describe("construireFiltre", () => {
  it("« ou » dans un critère, « et » entre critères, tous les genres exigés", () => {
    const filtre = construireFiltre(lireCriteres({ type: ["MANGA", "MANHWA"], genre: ["sport", "comedie"], note: "8" }));
    expect(filtre).toEqual([['type = "MANGA"', 'type = "MANHWA"'], 'genres = "sport"', 'genres = "comedie"', "noteMoyenne >= 8"]);
  });

  it("aucun filtre si rien n'est coché", () => {
    expect(construireFiltre(lireCriteres({}))).toEqual([]);
  });
});
