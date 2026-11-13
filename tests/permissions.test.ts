import { describe, expect, it } from "vitest";
import { aAuMoinsLeRole, estSuspendu } from "@/lib/permissions";

describe("aAuMoinsLeRole", () => {
  it("chaque rôle inclut les droits des rôles inférieurs", () => {
    expect(aAuMoinsLeRole("ADMIN", "MODERATEUR")).toBe(true);
    expect(aAuMoinsLeRole("ADMIN", "ADMIN")).toBe(true);
    expect(aAuMoinsLeRole("MODERATEUR", "LECTEUR")).toBe(true);
  });

  it("un rôle inférieur n'a pas les droits d'un rôle supérieur", () => {
    expect(aAuMoinsLeRole("LECTEUR", "MODERATEUR")).toBe(false);
    expect(aAuMoinsLeRole("MODERATEUR", "ADMIN")).toBe(false);
  });
});

describe("estSuspendu", () => {
  const maintenant = new Date("2026-06-01T12:00:00Z");

  it("faux sans date de suspension", () => {
    expect(estSuspendu(null, maintenant)).toBe(false);
    expect(estSuspendu(undefined, maintenant)).toBe(false);
  });

  it("vrai tant que la date de fin est dans le futur", () => {
    expect(estSuspendu(new Date("2026-06-02T00:00:00Z"), maintenant)).toBe(true);
  });

  it("faux une fois la suspension terminée", () => {
    expect(estSuspendu(new Date("2026-05-31T00:00:00Z"), maintenant)).toBe(false);
  });
});
