// Étape 4 — Middlewares : authentification, erreurs et 404 écrits une seule fois
import { existsSync } from "node:fs";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { sourceFiles } from "../helpers/source.js";

const KEY = { "X-Api-Key": "recif-secret" };
const expectError = (res: request.Response, status: number, code: string) => {
  expect(res.status).toBe(status);
  expect(res.headers["content-type"]).toMatch(/application\/json/);
  expect(res.body).toEqual({ error: expect.objectContaining({ code, message: expect.any(String) }) });
};

describe("étape 4 — Middlewares", () => {
  it("toutes les erreurs ont le même format JSON", async () => {
    const app = createApp();
    expectError(await request(app).post("/fish").send({}), 401, "UNAUTHORIZED");
    expectError(await request(app).delete("/fish/1"), 401, "UNAUTHORIZED");
    expectError(await request(app).get("/fish/999"), 404, "NOT_FOUND");
    expectError(await request(app).get("/fish/abc"), 400, "VALIDATION_ERROR");
    expectError(await request(app).post("/fish").set(KEY).send({ name: "" }), 400, "VALIDATION_ERROR");
    expectError(await request(app).post("/fish/3/adoptions").send({ adopterName: "A", adopterEmail: "a@b.fr" }), 409, "CONFLICT");
    expectError(await request(app).post("/adoptions/2/accept").set(KEY), 409, "CONFLICT");
    expectError(await request(app).get("/Récif"), 404, "NOT_FOUND");
  });

  it("un JSON mal formé donne 400 INVALID_JSON", async () => {
    const res = await request(createApp()).post("/fish").set(KEY).set("Content-Type", "application/json").send("{bad");
    expectError(res, 400, "INVALID_JSON");
  });

  it("les middlewares sont dans src/middlewares", () => {
    for (const f of ["require-api-key.ts", "error-handler.ts", "not-found.ts"]) {
      expect(existsSync(`src/middlewares/${f}`), f).toBe(true);
    }
  });

  it("la clé d'API n'est vérifiée qu'à un endroit, express.json() n'est branché qu'une fois", () => {
    const all = sourceFiles().map((f) => f.content).join("\n");
    expect(all.match(/x-api-key/gi)?.length ?? 0).toBe(1);
    expect(all.match(/express\.json\(/g)?.length ?? 0).toBe(1);
  });
});
