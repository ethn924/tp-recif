INSERT INTO fish (id, name, species, breed, birth_date, description, internal_notes, status, created_at) VALUES
  (1, 'Kumo',    'koi',           'Kohaku',   '2021-04-12', 'Grande koï blanche et rouge, vient manger dans la main.', 'Mange mal les granulés : préférer les vers congelés.', 'disponible', '2026-09-01T10:00:00.000Z'),
  (2, 'Indigo',  'betta',         'Halfmoon', '2023-06-02', 'Nageoires bleu nuit en éventail, très calme.',             'Agressif avec les autres mâles : bac seul obligatoire.', 'disponible', '2026-09-15T10:00:00.000Z'),
  (3, 'Caramel', 'poisson-rouge', 'Oranda',   '2024-02-20', 'Curieux, suit les doigts contre la vitre.',                '', 'reserve', '2026-10-01T10:00:00.000Z'),
  (4, 'Tamago',  'koi',           'Showa',    '2019-11-30', 'Énergique, a besoin d''un grand bassin.',                  'Saute : filet sur le bassin obligatoire.', 'adopte', '2026-08-01T10:00:00.000Z'),
  (5, 'Pixel',   'betta',         NULL,       NULL,         'Recueilli dans un bocal trop petit, très vif.',            'Traitement contre les points blancs jusqu''en janvier.', 'disponible', '2026-11-02T10:00:00.000Z');

INSERT INTO adoption_requests (id, fish_id, adopter_name, adopter_email, message, status, created_at, decided_at) VALUES
  (1, 3, 'Léa Martin',  'lea.martin@example.com',  'Nous avons un bac de 120 L, il cherche un copain.', 'en_attente', '2026-11-10T09:00:00.000Z', NULL),
  (2, 4, 'Tom Bernard', 'tom.bernard@example.com', 'Bassin de 8 000 L avec filtration.',              'acceptee',   '2026-08-20T09:00:00.000Z', '2026-08-31T10:00:00.000Z'),
  (3, 2, 'Jo Petit',    'jo.petit@example.com',    'Pour mon aquarium communautaire avec trois bettas.', 'refusee', '2026-10-05T09:00:00.000Z', '2026-10-06T10:00:00.000Z');
