// Étape 5 — DAO : tout le SQL d'une table dans un objet dédié, avec des paramètres
import { existsSync } from "node:fs";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { SqliteAdoptionDao } from "../../src/data/adoption.dao.js";
import { SqliteFishDao } from "../../src/data/fish.dao.js";
import { db } from "../../src/data/db.js";

const KEY = { "X-Api-Key": "recif-secret" };

describe("étape 5 — DAO", () => {
  it("SqliteFishDao lit les poissons", async () => {
    const dao = new SqliteFishDao(db);
    expect((await dao.findAll({ species: "betta" })).map((a) => a.name)).toEqual(["Indigo", "Pixel"]);
    expect((await dao.findById(2))?.name).toBe("Indigo");
    expect(await dao.findById(999)).toBeNull();
  });

  it("SqliteAdoptionDao lit les demandes", async () => {
    const dao = new SqliteAdoptionDao(db);
    expect((await dao.findAll({ status: "en_attente" })).map((r) => r.id)).toEqual([1]);
    expect((await dao.findById(2))?.status).toBe("acceptee");
    expect(await dao.findById(999)).toBeNull();
  });

  it("les filtres ne permettent plus d'injection SQL", async () => {
    const app = createApp();
    const fishes = await request(app).get("/fish").query({ species: "' OR '1'='1" });
    expect(fishes.status === 400 || fishes.body.length === 0).toBe(true);
    const requests = await request(app).get("/adoptions").set(KEY).query({ status: "x' OR 'a'='a" });
    expect(requests.status === 400 || requests.body.length === 0).toBe(true);
  });

  it("les noms de champs envoyés ne finissent plus dans le SQL", async () => {
    const app = createApp();
    const res = await request(app).put("/fish/1").set(KEY).send({ "name = 'Piraté' --": "x" });
    expect(res.status).toBeLessThan(500);
    const names = (await request(app).get("/fish")).body.map((a: { name: string }) => a.name);
    expect(names).toEqual(["Kumo", "Indigo", "Caramel", "Tamago", "Pixel"]);
  });

  it("le générateur de WHERE a disparu", () => {
    expect(existsSync("src/utils/query-helper.ts")).toBe(false);
  });
});
