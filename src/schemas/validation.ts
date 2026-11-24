export type Rule = (value: unknown) => string | null;
export type Schema = Record<string, Rule>; // nom du champ → sa règle

// Vérifie que le texte respecte une longueur minimale et maximale
export const text =
  (min: number, max: number): Rule =>
  (value) =>
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max
      ? null
      : `texte de ${min} à ${max} caractères attendu`;

// Vérifie que la valeur fait partie des choix autorisés
export const oneOf =
  (values: readonly string[]): Rule =>
  (value) =>
    typeof value === "string" && values.includes(value)
      ? null
      : "valeur inconnue";

// Champ facultatif : absent ou null, il est accepté ; présent, il doit respecter la règle
export const optional =
  (rule: Rule): Rule =>
  (value) =>
    value === undefined || value === null ? null : rule(value);

// Vérifie le format d'une adresse email
export const email: Rule = (value) =>
  typeof value === "string" &&
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
    ? null
    : "email invalide";

// Vérifie le format AAAA-MM-JJ et que la date existe
export const isoDate: Rule = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value
    ? null
    : "date invalide";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

// Vérifie les données reçues en fonction des règles du schema
export function validate<T = Record<string, any>>(
  schema: Schema,
  input: unknown,
  options: { partial?: boolean } = {}, // partial : pour une modification
): ValidationResult<T> {

  // Vérifie que input est bien un objet
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["input invalide"] };
  }

  // Prépare les données valides et les erreurs
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  // Parcourt chaque champ du schema
  for (const champ in schema) {
    const value = (input as Record<string, unknown>)[champ];

    // Si le champ est absent et que partial est activé, on l'ignore
    if (value === undefined && options.partial === true) {
      continue;
    }

    // Applique la règle de validation du champ
    const erreur = schema[champ](value);

    // Si une erreur est trouvée, on l'ajoute à la liste
    if (erreur !== null) {
      errors.push(erreur);
    } else {
      // Si le champ est valide, on le copie dans data
      // On enlève les espaces inutiles autour des textes
      data[champ] =
        typeof value === "string" ? value.trim() : value;
    }
  }

  // Si des erreurs existent, on retourne la liste des erreurs
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Si tout est valide, on retourne les données
  return { ok: true, data: data as T };
}