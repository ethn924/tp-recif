// Étape 12 — Synthèse : la fonctionnalité « statistiques », en autonomie
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

const KEY = { "X-Api-Key": "recif-secret" };

describe("étape 12 — Statistiques du Récif", () => {
  it("GET /stats (public) sur le jeu de données", async () => {
    const res = await request(createApp()).get("/stats");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      fish: {
        total: 5,
        byStatus: { disponible: 3, reserve: 1, adopte: 1 },
        bySpecies: { koi: 2, betta: 2, "poisson-rouge": 1, guppy: 0 },
      },
      adoptionRequests: { pending: 1, accepted: 1, refused: 1 },
      averageDaysToAdoption: 30,
    });
  });

  it("suit les changements", async () => {
    const app = createApp();
    await request(app).post("/adoptions/1/accept").set(KEY);
    await request(app).post("/fish").set(KEY).send({ name: "Bulle", species: "guppy" });
    const res = await request(app).get("/stats");
    expect(res.body.fish.total).toBe(6);
    expect(res.body.fish.byStatus).toEqual({ disponible: 4, reserve: 0, adopte: 2 });
    expect(res.body.fish.bySpecies.guppy).toBe(1);
    expect(res.body.adoptionRequests).toEqual({ pending: 0, accepted: 2, refused: 1 });
    expect(res.body.averageDaysToAdoption).toBeGreaterThan(30);
  });

  it("aucune adoption : averageDaysToAdoption vaut null", async () => {
    const app = createApp();
    await request(app).post("/adoptions/1/refuse").set(KEY);
    await request(app).delete("/fish/4").set(KEY); // supprime aussi sa demande acceptée
    expect((await request(app).get("/stats")).body.averageDaysToAdoption).toBeNull();
  });
});
