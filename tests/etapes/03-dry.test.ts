// Étape 3 — DRY : une règle, un seul endroit
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { config } from "../../src/config.js";
import { filesContaining, sourceFiles } from "../helpers/source.js";

const KEY = { "X-Api-Key": "recif-secret" };

describe("étape 3 — DRY", () => {
  it("les mêmes règles de validation en création et en modification", async () => {
    const app = createApp();
    expect((await request(app).put("/fish/1").set(KEY).send({ name: "x".repeat(51) })).status).toBe(400);
    expect((await request(app).put("/fish/1").set(KEY).send({ species: "guppy" })).status).toBe(200);
    expect((await request(app).put("/fish/1").set(KEY).send({ description: "x".repeat(1001) })).status).toBe(400);
  });

  it("un identifiant invalide donne 400 partout", async () => {
    const app = createApp();
    expect((await request(app).get("/fish/abc")).status).toBe(400);
    expect((await request(app).put("/fish/abc").set(KEY).send({ name: "X" })).status).toBe(400);
    expect((await request(app).delete("/fish/abc").set(KEY)).status).toBe(400);
    expect((await request(app).post("/fish/0/adoptions").send({ adopterName: "A", adopterEmail: "a@b.fr" })).status).toBe(400);
    expect((await request(app).post("/adoptions/abc/accept").set(KEY)).status).toBe(400);
  });

  it("la clé d'API vient de la configuration, pas du code", () => {
    expect(config.adminApiKey).toBe("recif-secret");
    expect(filesContaining(/recif-secret/)).toEqual([]);
  });

  it("la liste des espèces n'est écrite qu'une fois", () => {
    const count = sourceFiles().reduce((n, f) => n + (f.content.match(/["']koi["']\s*,\s*["']betta["']/g)?.length ?? 0), 0);
    expect(count).toBe(1);
  });
});
