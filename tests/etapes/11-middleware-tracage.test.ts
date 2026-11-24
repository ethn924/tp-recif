// Étape 11 — Un nouveau middleware : identifiant de requête et journal
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("étape 11 — Middleware de traçage", () => {
  it("chaque réponse porte un X-Request-Id unique", async () => {
    const app = createApp();
    const a = await request(app).get("/fish");
    const b = await request(app).get("/fish/999");
    expect(a.headers["x-request-id"]).toMatch(UUID);
    expect(b.headers["x-request-id"]).toMatch(UUID);
    expect(a.headers["x-request-id"]).not.toBe(b.headers["x-request-id"]);
  });

  it("reprend l'identifiant envoyé par le client s'il est valide", async () => {
    const app = createApp();
    expect((await request(app).get("/fish").set("X-Request-Id", "front-42")).headers["x-request-id"]).toBe("front-42");
    const tooLong = await request(app).get("/fish").set("X-Request-Id", "x".repeat(100));
    expect(tooLong.headers["x-request-id"]).toMatch(UUID);
  });

  it("les erreurs contiennent l'identifiant, pour retrouver la ligne de journal", async () => {
    const res = await request(createApp()).get("/Récif");
    expect(res.headers["x-request-id"]).toMatch(UUID);
    expect(res.body.error.requestId).toBe(res.headers["x-request-id"]);
  });

  it("une ligne de journal par requête : identifiant, méthode, chemin, statut, durée", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await request(createApp()).get("/fish?species=betta");
    const line = log.mock.calls.map((c) => c.join(" ")).find((l) => l.includes(res.headers["x-request-id"]));
    log.mockRestore();
    expect(line).toBeDefined();
    expect(line).toMatch(/GET \/fish\?species=betta/);
    expect(line).toMatch(/\b200\b/);
    expect(line).toMatch(/\d+(\.\d+)? ?ms/);
  });
});
