// Étape 10 — Decorator : un cache devant le catalogue, sans toucher au DAO existant
import { readFileSync } from "node:fs";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import type { FishDao } from "../../src/data/fish.dao.js";
import { CachedFishDao } from "../../src/data/cached-fish.dao.js";
import type { Fish } from "../../src/models/fish.js";

const kumo = { id: 1, name: "Kumo" } as Fish;

function fakeDao() {
  return {
    findAll: vi.fn(async () => [kumo]),
    findById: vi.fn(async () => kumo),
    create: vi.fn(async () => kumo),
    update: vi.fn(async () => kumo),
    delete: vi.fn(async () => true),
  };
}

describe("étape 10 — Decorator", () => {
  it("met en cache findAll, par combinaison de filtres", async () => {
    const inner = fakeDao();
    const dao = new CachedFishDao(inner as unknown as FishDao);
    expect(await dao.findAll({ species: "betta" })).toEqual([kumo]);
    await dao.findAll({ species: "betta" });
    expect(inner.findAll).toHaveBeenCalledTimes(1);
    await dao.findAll({ species: "koi" });
    await dao.findAll();
    expect(inner.findAll).toHaveBeenCalledTimes(3);
  });

  it("vide le cache à chaque écriture", async () => {
    const inner = fakeDao();
    const dao = new CachedFishDao(inner as unknown as FishDao);
    for (const write of [() => dao.create({ name: "N", species: "betta" }), () => dao.update(1, { name: "R" }), () => dao.delete(1)]) {
      await dao.findAll();
      await write();
      await dao.findAll();
    }
    // 1 appel au départ, puis 1 après chacune des 3 écritures
    expect(inner.findAll).toHaveBeenCalledTimes(4);
    expect(inner.create).toHaveBeenCalledTimes(1);
  });

  it("expire après ttlMs (horloge injectée)", async () => {
    const inner = fakeDao();
    let now = 0;
    const dao = new CachedFishDao(inner as unknown as FishDao, 1000, () => now);
    await dao.findAll();
    now = 999;
    await dao.findAll();
    now = 1000;
    await dao.findAll();
    expect(inner.findAll).toHaveBeenCalledTimes(2);
  });

  it("délègue le reste sans le modifier", async () => {
    const inner = fakeDao();
    const dao = new CachedFishDao(inner as unknown as FishDao);
    expect(await dao.findById(1)).toBe(kumo);
    expect(inner.findById).toHaveBeenCalledWith(1);
  });

  it("l'application utilise le cache sans que le service ait changé", () => {
    expect(readFileSync("src/app.ts", "utf8")).toMatch(/new CachedFishDao\(/);
    expect(readFileSync("src/services/fish.service.ts", "utf8")).not.toMatch(/Cached/);
  });

  it("le catalogue reste juste quand une adoption change un statut (invalidation)", async () => {
    const app = createApp();
    const available = async () => (await request(app).get("/fish?status=disponible")).body.map((a: Fish) => a.name);
    expect(await available()).toEqual(["Kumo", "Indigo", "Pixel"]);
    await request(app).post("/fish/1/adoptions").send({ adopterName: "Sam", adopterEmail: "sam@example.com" });
    expect(await available()).toEqual(["Indigo", "Pixel"]);
    await request(app).post("/adoptions/4/refuse").set({ "X-Api-Key": "recif-secret" });
    expect(await available()).toEqual(["Kumo", "Indigo", "Pixel"]);
  });
});
