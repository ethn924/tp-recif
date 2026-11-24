// TESTS DE CARACTÉRISATION — ils décrivent ce que l'API fait AUJOURD'HUI.
// Ils doivent rester verts à chaque étape du refactoring : ne les modifiez pas.
// Ils ne vérifient volontairement ni le format des erreurs, ni les noms des champs
// autres que id, name, species et status : ce sont eux que vous allez améliorer.
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let app: ReturnType<typeof createApp>;
beforeEach(() => {
  app = createApp();
});

const KEY = { "X-Api-Key": "recif-secret" };
const names = (body: { name: string }[]) => body.map((a) => a.name);
const newFish = { name: "Pépite", species: "poisson-rouge", breed: "Ryukin", birthDate: "2025-03-01", description: "Timide." };
const adopter = { adopterName: "Sam Leroy", adopterEmail: "sam.leroy@example.com", message: "Grand appartement calme." };

describe("GET /fish", () => {
  it("liste tous les poissons, par id", async () => {
    const res = await request(app).get("/fish");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(names(res.body)).toEqual(["Kumo", "Indigo", "Caramel", "Tamago", "Pixel"]);
  });

  it("filtre par espèce et par statut", async () => {
    expect(names((await request(app).get("/fish?species=betta")).body)).toEqual(["Indigo", "Pixel"]);
    expect(names((await request(app).get("/fish?status=disponible")).body)).toEqual(["Kumo", "Indigo", "Pixel"]);
    expect(names((await request(app).get("/fish?species=koi&status=adopte")).body)).toEqual(["Tamago"]);
  });
});

describe("GET /fish/:id", () => {
  it("renvoie un poisson", async () => {
    const res = await request(app).get("/fish/2");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 2, name: "Indigo", species: "betta", status: "disponible" });
  });

  it("404 si le poisson n'existe pas", async () => {
    expect((await request(app).get("/fish/999")).status).toBe(404);
  });
});

describe("POST /fish (personnel)", () => {
  it("401 sans clé d'API, et rien n'est créé", async () => {
    expect((await request(app).post("/fish").send(newFish)).status).toBe(401);
    expect((await request(app).post("/fish").set("X-Api-Key", "mauvaise").send(newFish)).status).toBe(401);
    expect((await request(app).get("/fish")).body).toHaveLength(5);
  });

  it("201 : le poisson est créé, disponible, et apparaît dans la liste", async () => {
    const res = await request(app).post("/fish").set(KEY).send(newFish);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 6, name: "Pépite", species: "poisson-rouge", status: "disponible" });
    expect(names((await request(app).get("/fish?species=poisson-rouge")).body)).toEqual(["Caramel", "Pépite"]);
  });

  it("400 si le nom ou l'espèce est invalide", async () => {
    expect((await request(app).post("/fish").set(KEY).send({ ...newFish, name: "" })).status).toBe(400);
    expect((await request(app).post("/fish").set(KEY).send({ ...newFish, name: "x".repeat(51) })).status).toBe(400);
    expect((await request(app).post("/fish").set(KEY).send({ ...newFish, species: "dragon" })).status).toBe(400);
    expect((await request(app).post("/fish").set(KEY).send({ ...newFish, birthDate: "pas une date" })).status).toBe(400);
  });
});

describe("PUT /fish/:id (personnel)", () => {
  it("modifie un poisson", async () => {
    const res = await request(app).put("/fish/1").set(KEY).send({ name: "Kumo le grand", description: "Très sociable." });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: "Kumo le grand", species: "koi" });
    expect((await request(app).get("/fish/1")).body.name).toBe("Kumo le grand");
  });

  it("401 sans clé, 404 si le poisson n'existe pas, 400 si le nom est vide", async () => {
    expect((await request(app).put("/fish/1").send({ name: "X" })).status).toBe(401);
    expect((await request(app).put("/fish/999").set(KEY).send({ name: "X" })).status).toBe(404);
    expect((await request(app).put("/fish/1").set(KEY).send({ name: "" })).status).toBe(400);
  });
});

describe("DELETE /fish/:id (personnel)", () => {
  it("204, puis le poisson n'existe plus", async () => {
    expect((await request(app).delete("/fish/3")).status).toBe(401);
    expect((await request(app).delete("/fish/3").set(KEY)).status).toBe(204);
    expect((await request(app).get("/fish/3")).status).toBe(404);
    expect((await request(app).delete("/fish/999").set(KEY)).status).toBe(404);
  });
});

describe("POST /fish/:id/adoptions (public)", () => {
  it("201 : la demande est créée en attente et le poisson devient réservé", async () => {
    const res = await request(app).post("/fish/1/adoptions").send(adopter);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 4, status: "en_attente" });
    expect((await request(app).get("/fish/1")).body.status).toBe("reserve");
  });

  it("409 si le poisson n'est pas disponible (réservé ou adopté)", async () => {
    expect((await request(app).post("/fish/3/adoptions").send(adopter)).status).toBe(409);
    expect((await request(app).post("/fish/4/adoptions").send(adopter)).status).toBe(409);
  });

  it("404 si le poisson n'existe pas, 400 si le formulaire est invalide", async () => {
    expect((await request(app).post("/fish/999/adoptions").send(adopter)).status).toBe(404);
    expect((await request(app).post("/fish/1/adoptions").send({ ...adopter, adopterEmail: "pas-un-email" })).status).toBe(400);
    expect((await request(app).post("/fish/1/adoptions").send({ ...adopter, adopterName: "" })).status).toBe(400);
  });
});

describe("GET /adoptions (personnel)", () => {
  it("liste les demandes, filtre par statut", async () => {
    expect((await request(app).get("/adoptions")).status).toBe(401);
    const all = await request(app).get("/adoptions").set(KEY);
    expect(all.status).toBe(200);
    expect(all.body.map((r: { id: number }) => r.id)).toEqual([1, 2, 3]);
    const pending = await request(app).get("/adoptions?status=en_attente").set(KEY);
    expect(pending.body.map((r: { id: number }) => r.id)).toEqual([1]);
  });
});

describe("POST /adoptions/:id/accept et /refuse (personnel)", () => {
  it("accepter : la demande est acceptée et le poisson adopté", async () => {
    expect((await request(app).post("/adoptions/1/accept")).status).toBe(401);
    const res = await request(app).post("/adoptions/1/accept").set(KEY);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, status: "acceptee" });
    expect((await request(app).get("/fish/3")).body.status).toBe("adopte");
  });

  it("refuser : la demande est refusée et le poisson redevient disponible", async () => {
    const res = await request(app).post("/adoptions/1/refuse").set(KEY);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, status: "refusee" });
    expect((await request(app).get("/fish/3")).body.status).toBe("disponible");
  });

  it("404 si la demande n'existe pas, 409 si elle est déjà traitée", async () => {
    expect((await request(app).post("/adoptions/999/accept").set(KEY)).status).toBe(404);
    expect((await request(app).post("/adoptions/2/accept").set(KEY)).status).toBe(409);
    expect((await request(app).post("/adoptions/3/refuse").set(KEY)).status).toBe(409);
  });
});

describe("routes inconnues", () => {
  it("404", async () => {
    expect((await request(app).get("/Récif")).status).toBe(404);
  });
});
