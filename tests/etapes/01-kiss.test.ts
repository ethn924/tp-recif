// Étape 1 — KISS : supprimer la sur-ingénierie
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { filesContaining } from "../helpers/source.js";

describe("étape 1 — KISS", () => {
  it("le « formateur de réponses » a disparu", () => {
    expect(existsSync("src/utils/response-formatter.ts")).toBe(false);
    expect(filesContaining(/ResponseFormatterFactory|getFormatter|ResponseStrategy/)).toEqual([]);
  });
});
