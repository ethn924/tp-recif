import express from "express";
import Database from "better-sqlite3";
import { buildWhere } from "./utils/query-helper.js";

const DB_FILE = process.env.DB_FILE || "recif.db";

export function createApp() {
  const app = express();

  // ---------------------------------------------------------------- POISSONS

  // Liste des poissons, avec filtres ?species= et ?status=
  app.get("/fish", (req, res) => {
    const db = new Database(DB_FILE);
    try {
      const filters: any = {};
      if (req.query.species) filters.species = { op: "eq", value: req.query.species };
      if (req.query.status) filters.status = { op: "eq", value: req.query.status };
      const rows = db.prepare("SELECT * FROM fish " + buildWhere(filters) + " ORDER BY id").all();
      res.status(200).json(rows)
    } catch (e) {
      console.log(e);
      res.status(500).send("Erreur");
    }
  });

  // Détail d'un poisson, avec ses demandes d'adoption
  app.get("/fish/:id", (req, res) => {
    const db = new Database(DB_FILE);
    const fish: any = db.prepare("SELECT * FROM fish WHERE id = ?").get(req.params.id);
    if (!fish) {
      db.close();
      res.status(404).send("Poisson introuvable");
      return;
    }
    fish.requests = db.prepare("SELECT * FROM adoption_requests WHERE fish_id = ?").all(req.params.id);
    db.close();
    res.status(200).json(fish)
  });

  // Ajout d'un poisson (équipe du Récif)
  app.post("/fish", express.json(), (req, res) => {
    if (req.headers["x-api-key"] !== "recif-secret") {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }
    const b = req.body;
    if (!b.name || typeof b.name !== "string" || b.name.trim().length === 0 || b.name.length > 50) {
      res.status(400).json({ message: "Nom invalide" });
      return;
    }
    if (!b.species || ["koi", "betta", "poisson-rouge", "guppy"].indexOf(b.species) === -1) {
      res.status(400).json({ message: "Espèce invalide" });
      return;
    }
    if (b.birthDate && isNaN(Date.parse(b.birthDate))) {
      res.status(400).json({ message: "Date de naissance invalide" });
      return;
    }
    if (b.description && b.description.length > 1000) {
      res.status(400).json({ message: "Description trop longue" });
      return;
    }
    const db = new Database(DB_FILE);
    const info = db
      .prepare(
        "INSERT INTO fish (name, species, breed, birth_date, description, internal_notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'disponible', ?)",
      )
      .run(b.name.trim(), b.species, b.breed || null, b.birthDate || null, b.description || "", b.internalNotes || "", new Date().toISOString());
    const fish = db.prepare("SELECT * FROM fish WHERE id = ?").get(info.lastInsertRowid);
    db.close();
    res.status(201).json(fish)
  });

  // Modification d'un poisson (équipe du Récif)
  app.put("/fish/:id", express.json(), (req, res) => {
    if (req.headers["x-api-key"] !== "recif-secret") {
      res.status(401).json({ error: "Clé API manquante" });
      return;
    }
    const b = req.body;
    if (b.name !== undefined && (typeof b.name !== "string" || b.name.trim().length === 0 || b.name.length > 100)) {
      res.status(400).json({ error: "Nom invalide" });
      return;
    }
    if (b.species !== undefined && ["koi", "betta", "poisson-rouge"].indexOf(b.species) === -1) {
      res.status(400).json({ error: "Espèce invalide" });
      return;
    }
    if (b.birthDate && isNaN(Date.parse(b.birthDate))) {
      res.status(400).json({ error: "Date invalide" });
      return;
    }
    const db = new Database(DB_FILE);
    const existing = db.prepare("SELECT * FROM fish WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Poisson introuvable" });
      return;
    }
    // On met à jour tous les champs envoyés
    const keys = Object.keys(b);
    if (keys.length > 0) {
      const sets = keys.map((k) => k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase()) + " = ?").join(", ");
      db.prepare("UPDATE fish SET " + sets + " WHERE id = ?").run(...keys.map((k) => b[k]), req.params.id);
    }
    const fish = db.prepare("SELECT * FROM fish WHERE id = ?").get(req.params.id);
    db.close();
    res.status(200).json(fish)
  });

  // Suppression d'un poisson (équipe du Récif)
  app.delete("/fish/:id", (req, res) => {
    if (req.headers["x-api-key"] !== "recif-secret") {
      res.status(401).send("Non autorisé");
      return;
    }
    const db = new Database(DB_FILE);
    const fish = db.prepare("SELECT * FROM fish WHERE id = ?").get(req.params.id);
    if (!fish) {
      res.status(404).json({ message: "Poisson introuvable" });
      return;
    }
    db.prepare("DELETE FROM adoption_requests WHERE fish_id = ?").run(req.params.id);
    db.prepare("DELETE FROM fish WHERE id = ?").run(req.params.id);
    res.status(204).end();
  });

  // ---------------------------------------------------------------- ADOPTIONS

  // Demande d'adoption (public)
  app.post("/fish/:id/adoptions", express.json(), (req, res) => {
    const b = req.body;
    if (!b.adopterName || typeof b.adopterName !== "string" || b.adopterName.trim().length === 0 || b.adopterName.length > 80) {
      res.status(400).json({ message: "Nom de l'adoptant invalide" });
      return;
    }
    if (!b.adopterEmail || typeof b.adopterEmail !== "string" || b.adopterEmail.indexOf("@") === -1) {
      res.status(400).json({ message: "Email invalide" });
      return;
    }
    if (b.message && b.message.length > 500) {
      res.status(400).json({ message: "Message trop long" });
      return;
    }
    const db = new Database(DB_FILE);
    const fish: any = db.prepare("SELECT * FROM fish WHERE id = ?").get(req.params.id);
    if (!fish) {
      db.close();
      res.status(404).json({ message: "Poisson introuvable" });
      return;
    }
    if (fish.status !== "disponible") {
      db.close();
      res.status(409).json({ error: "Ce poisson n'est plus disponible" });
      return;
    }
    const info = db
      .prepare(
        "INSERT INTO adoption_requests (fish_id, adopter_name, adopter_email, message, status, created_at) VALUES (?, ?, ?, ?, 'en_attente', ?)",
      )
      .run(req.params.id, b.adopterName.trim(), b.adopterEmail, b.message || "", new Date().toISOString());
    db.prepare("UPDATE fish SET status = 'reserve' WHERE id = ?").run(req.params.id);
    const request = db.prepare("SELECT * FROM adoption_requests WHERE id = ?").get(info.lastInsertRowid);
    db.close();
    res.status(201).json(request)
  });

  // Liste des demandes (équipe du Récif), filtre ?status=
  app.get("/adoptions", (req, res) => {
    if (req.headers["x-api-key"] !== "recif-secret") {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }
    const db = new Database(DB_FILE);
    const filters: any = {};
    if (req.query.status) filters.status = { op: "eq", value: req.query.status };
    const rows = db.prepare("SELECT * FROM adoption_requests " + buildWhere(filters) + " ORDER BY id").all();
    db.close();
    res.status(200).json(rows)
  });

  // Accepter une demande (équipe du Récif)
  app.post("/adoptions/:id/accept", (req, res) => {
    if (req.headers["x-api-key"] !== "recif-secret") {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }
    const db = new Database(DB_FILE);
    const request: any = db.prepare("SELECT * FROM adoption_requests WHERE id = ?").get(req.params.id);
    if (!request) {
      db.close();
      res.status(404).json({ message: "Demande introuvable" });
      return;
    }
    if (request.status !== "en_attente") {
      db.close();
      res.status(409).json({ message: "Demande déjà traitée" });
      return;
    }
    db.prepare("UPDATE adoption_requests SET status = 'acceptee', decided_at = ? WHERE id = ?").run(new Date().toISOString(), req.params.id);
    db.prepare("UPDATE fish SET status = 'adopte' WHERE id = ?").run(request.fish_id);
    const updated = db.prepare("SELECT * FROM adoption_requests WHERE id = ?").get(req.params.id);
    db.close();
    console.log("Demande " + req.params.id + " acceptée, il faudrait prévenir " + request.adopter_email);
    res.status(200).json(updated)
  });

  // Refuser une demande (équipe du Récif)
  app.post("/adoptions/:id/refuse", (req, res) => {
    if (req.headers["x-api-key"] !== "recif-secret") {
      res.status(401).json({ message: "Non autorisé" });
      return;
    }
    const db = new Database(DB_FILE);
    const request: any = db.prepare("SELECT * FROM adoption_requests WHERE id = ?").get(req.params.id);
    if (!request) {
      db.close();
      res.status(404).json({ message: "Demande introuvable" });
      return;
    }
    if (request.status !== "en_attente") {
      db.close();
      res.status(409).json({ message: "Demande déjà traitée" });
      return;
    }
    db.prepare("UPDATE adoption_requests SET status = 'refusee', decided_at = ? WHERE id = ?").run(new Date().toISOString(), req.params.id);
    db.prepare("UPDATE fish SET status = 'disponible' WHERE id = ?").run(request.fish_id);
    const updated = db.prepare("SELECT * FROM adoption_requests WHERE id = ?").get(req.params.id);
    db.close();
    console.log("Demande " + req.params.id + " refusée, il faudrait prévenir " + request.adopter_email);
    res.status(200).json(updated)
  });

  return app;
}
