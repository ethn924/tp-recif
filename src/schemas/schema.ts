// Mini bibliothèque de validation déclarative (DSL).
// Chaque règle porte sa propre validation : une seule source de vérité par contrainte.

export interface Rule<T = unknown> {
  readonly optional: boolean;
  check(value: unknown): string | null;
}

export type Schema = Record<string, Rule<any>>;

// Chaîne de caractères, longueur (après trim) entre min et max.
export function text(min: number, max: number): Rule<string> {
  return {
    optional: false,
    check(value) {
      if (typeof value !== "string") return "texte attendu";
      const len = value.trim().length;
      if (len < min || value.length > max)
        return `doit contenir entre ${min} et ${max} caractères`;
      return null;
    },
  };
}

// Valeur appartenant à une liste fermée.
export function oneOf<T extends readonly unknown[]>(
  values: T,
): Rule<T[number]> {
  return {
    optional: false,
    check(value) {
      if (!(values as readonly unknown[]).includes(value)) {
        return `valeur inconnue (attendu : ${values.join(", ")})`;
      }
      return null;
    },
  };
}

// Date ISO valide.
export const isoDate: Rule<string> = {
  optional: false,
  check(value) {
    if (
      typeof value !== "string" ||
      value.trim() === "" ||
      isNaN(Date.parse(value))
    ) {
      return "date invalide";
    }
    return null;
  },
};

// Rend une règle facultative : une valeur absente (undefined/null) est acceptée.
export function optional<T>(rule: Rule<T>): Rule<T | undefined> {
  return {
    optional: true,
    check(value) {
      if (value === undefined || value === null) return null;
      return rule.check(value);
    },
  };
}

/**
 * Valide un objet `body` contre un `schema`.
 * @param partial true pour une modification (PUT) : les champs absents sont ignorés.
 * @returns le premier message d'erreur, ou null si tout est valide.
 */
export function validate(
  schema: Schema,
  body: any,
  partial = false,
): string | null {
  const data = body ?? {};
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const absent = value === undefined || value === null;
    if (absent) {
      if (!rule.optional && !partial) return `champ requis : ${field}`;
      continue;
    }
    const error = rule.check(value);
    if (error) return error;
  }
  return null;
}

export const email: Rule<string> = {
  optional: false,
  check(value) {
    if (
      typeof value !== "string" ||
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
    ) {
      return "email invalide";
    }
    return null;
  },
};
