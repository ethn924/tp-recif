import { readFileSync, rmSync } from "node:fs";
import Database from "better-sqlite3";

const schema = readFileSync("db/schema.sql", "utf8");
const seed = readFileSync("db/seed.sql", "utf8");

// Remet la base de test dans l'état du jeu de données, avant chaque test.
// Une connexion séparée : fonctionne que l'application garde sa connexion ouverte ou non.
export function resetDb() {
  const db = new Database(process.env.DB_FILE!);
  db.exec(schema);
  db.exec("DELETE FROM adoption_requests; DELETE FROM fish; DELETE FROM sqlite_sequence;");
  db.exec(seed);
  db.close();
  rmSync(process.env.OUTBOX_FILE!, { force: true });
}
