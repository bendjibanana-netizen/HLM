import { describe, expect, it } from "vitest";
import { autoriseParRobots, estAdresseInterne, extraireNumero } from "@/lib/sync/regles";

describe("extraireNumero", () => {
  it("reconnaît les formes courantes", () => {
    expect(extraireNumero("Chapitre 12")).toBe("12");
    expect(extraireNumero("Ma Série — Chapter 7.5")).toBe("7.5");
    expect(extraireNumero("Ch. 03")).toBe("3");
    expect(extraireNumero("Épisode 4 : le retour")).toBe("4");
    expect(extraireNumero("Sortie #18")).toBe("18");
    expect(extraireNumero("chapitre 12,5")).toBe("12.5");
  });

  it("accepte un nombre en fin de titre ou d'adresse", () => {
    expect(extraireNumero("/serie/ma-serie/42")).toBe("42");
  });

  it("renvoie null sans numéro", () => {
    expect(extraireNumero("Annonce : pause estivale")).toBeNull();
  });
});

describe("autoriseParRobots", () => {
  const agent = "HLMBot/1.0 (+https://exemple.test)";

  it("autorise tout sans fichier ou sans règle", () => {
    expect(autoriseParRobots("", "/page", agent)).toBe(true);
    expect(autoriseParRobots("User-agent: *\nDisallow:", "/page", agent)).toBe(true);
  });

  it("respecte une interdiction générale", () => {
    const robots = "User-agent: *\nDisallow: /prive/\n";
    expect(autoriseParRobots(robots, "/prive/serie", agent)).toBe(false);
    expect(autoriseParRobots(robots, "/public", agent)).toBe(true);
  });

  it("la règle la plus précise l'emporte (Allow dans un dossier interdit)", () => {
    const robots = "User-agent: *\nDisallow: /lire/\nAllow: /lire/extraits/\n";
    expect(autoriseParRobots(robots, "/lire/chapitre-1", agent)).toBe(false);
    expect(autoriseParRobots(robots, "/lire/extraits/1", agent)).toBe(true);
  });

  it("les règles qui nomment notre robot priment sur celles de « * »", () => {
    const robots = "User-agent: *\nAllow: /\n\nUser-agent: hlmbot\nDisallow: /\n";
    expect(autoriseParRobots(robots, "/page", agent)).toBe(false);
    expect(autoriseParRobots(robots, "/page", "AutreRobot/2.0")).toBe(true);
  });

  it("gère les jokers et les commentaires", () => {
    const robots = "# fichier de test\nUser-agent: *\nDisallow: /*.zip$ # archives\n";
    expect(autoriseParRobots(robots, "/fichiers/tome.zip", agent)).toBe(false);
    expect(autoriseParRobots(robots, "/fichiers/tome.zip.txt", agent)).toBe(true);
  });
});

describe("estAdresseInterne", () => {
  it("refuse les adresses locales et privées", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.1.10", "172.16.0.1", "172.31.255.255", "169.254.169.254", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) {
      expect(estAdresseInterne(ip), ip).toBe(true);
    }
  });

  it("accepte les adresses publiques", () => {
    for (const ip of ["93.184.216.34", "8.8.8.8", "172.32.0.1", "2001:4860:4860::8888"]) {
      expect(estAdresseInterne(ip), ip).toBe(false);
    }
  });
});
