import Database from "better-sqlite3";

// Un module n'est évalué qu'une fois : tous les imports partagent cette connexion
export const db = new Database(process.env.DB_FILE ?? "recif.db");
db.pragma("foreign_keys = ON");
