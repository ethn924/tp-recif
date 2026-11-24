// Étape 6 — DAL : une couche, la seule qui connaît la base
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SqliteAdoptionDao } from "../../src/data/adoption.dao.js";
import { SqliteFishDao } from "../../src/data/fish.dao.js";
import { db } from "../../src/data/db.js";
import { sourceFiles } from "../helpers/source.js";

const outsideData = () => sourceFiles().filter((f) => !f.path.startsWith("src/data/"));

describe("étape 6 — DAL", () => {
  it("rien en dehors de src/data n'importe better-sqlite3", () => {
    expect(outsideData().filter((f) => /from ["']better-sqlite3["']/.test(f.content)).map((f) => f.path)).toEqual([]);
  });

  it("aucun SQL en dehors de src/data", () => {
    const sql = /\.(prepare|exec|transaction)\(|\b(SELECT|INSERT INTO|UPDATE|DELETE FROM)\b/;
    expect(outsideData().filter((f) => sql.test(f.content)).map((f) => f.path)).toEqual([]);
  });

  it("les opérations sur deux tables sont des transactions", () => {
    expect(readFileSync("src/data/adoption.dao.ts", "utf8")).toMatch(/\.transaction\(/);
    expect(readFileSync("src/data/fish.dao.ts", "utf8")).toMatch(/\.transaction\(/);
  });

  it("la DAL renvoie des objets métier (camelCase), pas des lignes SQL", async () => {
    const fish = await new SqliteFishDao(db).findById(1);
    expect(fish).toMatchObject({ id: 1, birthDate: "2021-04-12", internalNotes: "Mange mal les granulés : préférer les vers congelés." });
    expect(fish).not.toHaveProperty("birth_date");
    const request = await new SqliteAdoptionDao(db).findById(1);
    expect(request).toMatchObject({ fishId: 3, adopterEmail: "lea.martin@example.com", decidedAt: null });
  });

  it("create, accept et refuse mettent aussi à jour le poisson", async () => {
    const adoptions = new SqliteAdoptionDao(db);
    const fishes = new SqliteFishDao(db);
    const created = await adoptions.create({ fishId: 1, adopterName: "Sam", adopterEmail: "sam@example.com", message: "" });
    expect(created.status).toBe("en_attente");
    expect((await fishes.findById(1))?.status).toBe("reserve");
    expect((await adoptions.accept(created.id)).status).toBe("acceptee");
    expect((await fishes.findById(1))?.status).toBe("adopte");
    expect((await adoptions.refuse(1)).decidedAt).not.toBeNull();
    expect((await fishes.findById(3))?.status).toBe("disponible");
  });
});
