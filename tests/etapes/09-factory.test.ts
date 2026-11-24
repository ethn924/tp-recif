// Étape 9 — Factory : notifier l'adoptant, par le canal choisi dans la configuration
import { existsSync, readFileSync } from "node:fs";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { createNotifier } from "../../src/notifications/notifier.factory.js";

const KEY = { "X-Api-Key": "recif-secret" };
const outbox = () =>
  existsSync(process.env.OUTBOX_FILE!)
    ? readFileSync(process.env.OUTBOX_FILE!, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
    : [];

describe("étape 9 — Factory", () => {
  it("createNotifier fabrique le bon notifier", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await createNotifier("console").send({ to: "a@b.fr", subject: "Test", body: "Bonjour" });
    expect(log).toHaveBeenCalled();
    await createNotifier(undefined).send({ to: "a@b.fr", subject: "Défaut", body: "console" });
    await createNotifier("file").send({ to: "c@d.fr", subject: "Fichier", body: "Bonjour" });
    expect(outbox()).toEqual([expect.objectContaining({ to: "c@d.fr", subject: "Fichier", body: "Bonjour" })]);
    log.mockRestore();
  });

  it("refuse un canal inconnu, avec un message clair", () => {
    expect(() => createNotifier("pigeon")).toThrow(/pigeon/);
  });

  it("l'adoptant est prévenu à chaque étape de sa demande", async () => {
    const app = createApp();
    await request(app).post("/fish/1/adoptions").send({ adopterName: "Sam", adopterEmail: "sam@example.com" });
    await request(app).post("/adoptions/4/accept").set(KEY);
    await request(app).post("/adoptions/1/refuse").set(KEY);
    const sent = outbox();
    expect(sent.map((m: { to: string }) => m.to)).toEqual(["sam@example.com", "sam@example.com", "lea.martin@example.com"]);
    const text = sent.map((m: { subject: string; body: string }) => `${m.subject} ${m.body}`.toLowerCase());
    expect(text[0]).toMatch(/reçue/);
    expect(text[1]).toMatch(/accept/);
    expect(text[2]).toMatch(/refus/);
    expect(text[1]).toMatch(/kumo/);
  });

  it("aucune notification si l'action échoue", async () => {
    await request(createApp()).post("/adoptions/2/accept").set(KEY); // déjà traitée → 409
    expect(outbox()).toEqual([]);
  });
});
