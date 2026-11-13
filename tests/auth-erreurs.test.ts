import { describe, expect, it } from "vitest";
import { cleErreurAuth, destinationSure } from "@/components/auth/erreurs";

describe("destinationSure", () => {
  it("accepte un chemin interne", () => {
    expect(destinationSure("/bibliotheque", "/")).toBe("/bibliotheque");
    expect(destinationSure("/en/library?onglet=listes", "/")).toBe("/en/library?onglet=listes");
  });

  it("refuse toute destination hors du site", () => {
    expect(destinationSure("https://example.org/piege", "/")).toBe("/");
    expect(destinationSure("//example.org", "/")).toBe("/");
    expect(destinationSure("/\\example.org", "/")).toBe("/");
    expect(destinationSure("javascript:alert(1)", "/")).toBe("/");
  });

  it("utilise la destination par défaut si rien n'est demandé", () => {
    expect(destinationSure(undefined, "/en")).toBe("/en");
    expect(destinationSure("", "/en")).toBe("/en");
  });
});

describe("cleErreurAuth", () => {
  it("reconnaît les codes du serveur d'authentification", () => {
    expect(cleErreurAuth({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 })).toBe("INVALID_EMAIL_OR_PASSWORD");
    expect(cleErreurAuth({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", status: 422 })).toBe("USER_ALREADY_EXISTS");
    expect(cleErreurAuth({ code: "PSEUDO_DEJA_PRIS", status: 422 })).toBe("PSEUDO_DEJA_PRIS");
  });

  it("signale le limiteur de tentatives quel que soit le code", () => {
    expect(cleErreurAuth({ status: 429 })).toBe("TROP_DE_TENTATIVES");
  });

  it("retombe sur un message générique pour une erreur inconnue", () => {
    expect(cleErreurAuth({ code: "AUTRE_CHOSE", status: 500 })).toBe("INCONNUE");
    expect(cleErreurAuth(null)).toBe("INCONNUE");
  });
});
