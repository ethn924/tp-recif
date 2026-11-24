# Le Récif — API d'adoption de poissons

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)

L'association Le Récif recueille des poissons dont les propriétaires ne peuvent plus s'occuper et leur trouve un nouvel aquarium. Son API fonctionne… mais son code est difficile à lire, à tester et à faire évoluer.
Votre mission : la **refactoriser** sans rien casser, puis lui **ajouter des fonctionnalités**.
L'énoncé détaillé, étape par étape, est dans le document « TP — Refactoriser Le Récif ».

## Démarrer

```bash
npm install
cp .env.example .env
npm run db:init        # crée recif.db avec 5 poissons et 3 demandes d'adoption
npm run dev            # http://localhost:3000
```

contenu .env.example
PORT=3000
DB_FILE=recif.db
ADMIN_API_KEY=recif-secret

## Les commandes de test

| Commande | Rôle |
|---|---|
| `npm test` | Tests de **caractérisation** : ce que l'API fait aujourd'hui. Verts au départ, ils doivent **rester verts** à chaque étape. |
| `npm run etape -- 03` | Les tests de l'étape 3. Rouges au départ, verts quand l'étape est terminée. |
| `npm run etape` | Les tests de toutes les étapes. |
| `npm run typecheck` | Vérification TypeScript. |

Ne modifiez pas les fichiers du dossier `tests/`.

## Les routes

| Méthode | Chemin | Accès | Rôle |
|---|---|---|---|
| GET | `/fish?species=&status=` | public | Catalogue des poissons |
| GET | `/fish/:id` | public | Fiche d'un poisson |
| POST | `/fish/:id/adoptions` | public | Déposer une demande d'adoption |
| POST | `/fish` | personnel | Ajouter un poisson |
| PUT | `/fish/:id` | personnel | Modifier un poisson |
| DELETE | `/fish/:id` | personnel | Supprimer un poisson |
| GET | `/adoptions?status=` | personnel | Lister les demandes |
| POST | `/adoptions/:id/accept` | personnel | Accepter une demande |
| POST | `/adoptions/:id/refuse` | personnel | Refuser une demande |

Accès « personnel » : en-tête `X-Api-Key: recif-secret`.

Espèces : `koi`, `betta`, `poisson-rouge`, `guppy`. Statuts d'un poisson : `disponible`, `reserve`, `adopte`. Statuts d'une demande : `en_attente`, `acceptee`, `refusee`.
