// Étape 2 — Singleton : une seule connexion à la base pour toute l'application
import { describe, expect, it } from "vitest";
import { db } from "../../src/data/db.js";
import { sourceFiles } from "../helpers/source.js";

describe("étape 2 — Singleton", () => {
  it("src/data/db.ts exporte une connexion ouverte", () => {
    expect(db.open).toBe(true);
    expect(db.prepare("SELECT COUNT(*) AS n FROM fish").get()).toEqual({ n: 5 });
  });

  it("la connexion n'est créée qu'à un seul endroit du code", () => {
    const creations = sourceFiles().flatMap((f) => (f.content.match(/new Database\(/g) ?? []).map(() => f.path));
    expect(creations).toEqual(["src/data/db.ts"]);
  });
});
