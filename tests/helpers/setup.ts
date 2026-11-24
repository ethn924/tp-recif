import { mkdirSync } from "node:fs";
import { beforeEach } from "vitest";
import { resetDb } from "./reset-db.js";

mkdirSync("tmp", { recursive: true });
resetDb();
beforeEach(() => resetDb());
