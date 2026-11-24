import Database from "better-sqlite3";
import { config } from "../config.js"

// Un module n'est évalué qu'une fois : tous les imports partagent cette connexion
export const db = new Database(config.dbFile);
db.pragma("foreign_keys = ON");
