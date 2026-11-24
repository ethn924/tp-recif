// Étape 8 — DTO : ce qu'on accepte en entrée, ce qu'on expose en sortie
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

const KEY = { "X-Api-Key": "recif-secret" };
const PUBLIC_FISH = ["birthDate", "breed", "description", "id", "name", "species", "status"];

let app: ReturnType<typeof createApp>;
beforeEach(() => {
  app = createApp();
});

// Aucune clé en snake_case, à aucune profondeur
function snakeKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(snakeKeys);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => [...(k.includes("_") ? [k] : []), ...snakeKeys(v)]);
  }
  return [];
}

describe("étape 8 — DTO de sortie", () => {
  it("la vue publique d'un poisson n'expose ni notes internes ni demandes", async () => {
    const list = await request(app).get("/fish");
    for (const a of list.body) expect(Object.keys(a).sort()).toEqual(PUBLIC_FISH);
    const one = await request(app).get("/fish/2");
    expect(Object.keys(one.body).sort()).toEqual(PUBLIC_FISH);
    expect(JSON.stringify(one.body)).not.toMatch(/Agressif avec|@example\.com/);
  });

  it("la vue du personnel contient les notes internes", async () => {
    const res = await request(app).post("/fish").set(KEY).send({ name: "Pépite", species: "poisson-rouge", internalNotes: "Quarantaine de 15 jours à l'arrivée." });
    expect(res.body).toMatchObject({ name: "Pépite", internalNotes: "Quarantaine de 15 jours à l'arrivée.", createdAt: expect.any(String) });
  });

  it("la demande d'adoption renvoyée au public ne contient que l'essentiel", async () => {
    const res = await request(app).post("/fish/1/adoptions").send({ adopterName: "Sam", adopterEmail: "sam@example.com" });
    expect(Object.keys(res.body).sort()).toEqual(["createdAt", "fishId", "id", "status"]);
  });

  it("le personnel voit les demandes complètes", async () => {
    const res = await request(app).get("/adoptions").set(KEY);
    expect(res.body[0]).toMatchObject({ id: 1, fishId: 3, adopterName: "Léa Martin", adopterEmail: "lea.martin@example.com", decidedAt: null });
  });

  it("aucune réponse ne contient de clé snake_case", async () => {
    const responses = [
      await request(app).get("/fish"),
      await request(app).get("/fish/1"),
      await request(app).get("/adoptions").set(KEY),
      await request(app).put("/fish/1").set(KEY).send({ name: "Kumo" }),
      await request(app).post("/adoptions/1/accept").set(KEY),
    ];
    for (const res of responses) expect(snakeKeys(res.body)).toEqual([]);
  });
});

describe("étape 8 — DTO d'entrée", () => {
  it("refuse les champs que le client ne doit pas contrôler (mass assignment)", async () => {
    expect((await request(app).put("/fish/1").set(KEY).send({ status: "adopte" })).status).toBe(400);
    expect((await request(app).put("/fish/1").set(KEY).send({ id: 99 })).status).toBe(400);
    expect((await request(app).post("/fish").set(KEY).send({ name: "Z", species: "betta", status: "adopte" })).status).toBe(400);
    const adoption = await request(app).post("/fish/1/adoptions").send({ adopterName: "Sam", adopterEmail: "sam@example.com", status: "acceptee" });
    expect(adoption.status).toBe(400);
    expect((await request(app).get("/fish/1")).body.status).toBe("disponible");
  });

  it("valide les filtres de la query string", async () => {
    expect((await request(app).get("/fish?species=dragon")).status).toBe(400);
    expect((await request(app).get("/adoptions?status=perdue").set(KEY)).status).toBe(400);
  });
});
