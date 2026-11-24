CREATE TABLE IF NOT EXISTS fish (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  species        TEXT    NOT NULL,          -- koi, betta, poisson-rouge, guppy
  breed          TEXT,
  birth_date     TEXT,                      -- AAAA-MM-JJ
  description    TEXT    NOT NULL DEFAULT '',
  internal_notes TEXT    NOT NULL DEFAULT '', -- réservé au personnel
  status         TEXT    NOT NULL DEFAULT 'disponible', -- disponible, reserve, adopte
  created_at     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS adoption_requests (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  fish_id      INTEGER NOT NULL REFERENCES fish(id),
  adopter_name   TEXT    NOT NULL,
  adopter_email  TEXT    NOT NULL,
  message        TEXT    NOT NULL DEFAULT '',
  status         TEXT    NOT NULL DEFAULT 'en_attente', -- en_attente, acceptee, refusee
  created_at     TEXT    NOT NULL,
  decided_at     TEXT
);
