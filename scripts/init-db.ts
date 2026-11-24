// Crée (ou recrée) la base et y insère les données de démonstration : npm run db:init
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

const file = process.env.DB_FILE ?? "recif.db";
mkdirSync(dirname(file), { recursive: true });
rmSync(file, { force: true });
const db = new Database(file);
db.exec(readFileSync("db/schema.sql", "utf8"));
db.exec(readFileSync("db/seed.sql", "utf8"));
db.close();
console.log(`Base ${file} initialisée.`);
