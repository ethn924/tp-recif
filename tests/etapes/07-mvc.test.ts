// Étape 7 — MVC : routes, contrôleurs, services, modèles
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FishDao } from "../../src/data/fish.dao.js";
import { FishService } from "../../src/services/fish.service.js";
import { sourceFiles } from "../helpers/source.js";

const inDir = (dir: string) => sourceFiles(dir);

describe("étape 7 — MVC", () => {
  it("les dossiers existent", () => {
    for (const dir of ["src/routes", "src/controllers", "src/services", "src/models"]) {
      expect(existsSync(dir), dir).toBe(true);
    }
  });

  it("app.ts assemble, il ne déclare plus de route", () => {
    expect(readFileSync("src/app.ts", "utf8")).not.toMatch(/app\.(get|post|put|patch|delete)\(/);
  });

  it("les routes ne font que relier un chemin à un contrôleur", () => {
    const bad = inDir("src/routes").filter((f) => /req\.(body|params|query)|res\.(json|status|send)/.test(f.content));
    expect(bad.map((f) => f.path)).toEqual([]);
  });

  it("les contrôleurs passent par les services, pas par la DAL", () => {
    const bad = inDir("src/controllers").filter((f) => /from ["'][./]*data\//.test(f.content));
    expect(bad.map((f) => f.path)).toEqual([]);
  });

  it("les services ne connaissent pas HTTP", () => {
    const bad = inDir("src/services").filter((f) => /from ["']express["']|\breq\.|\bres\./.test(f.content));
    expect(bad.map((f) => f.path)).toEqual([]);
  });

  it("un service se teste sans base de données", async () => {
    const fakeDao = { findById: async () => null } as unknown as FishDao;
    await expect(new FishService(fakeDao).get(999)).rejects.toMatchObject({ status: 404 });
  });
});
