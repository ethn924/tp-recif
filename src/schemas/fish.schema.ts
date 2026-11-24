import { isoDate, oneOf, optional, text, type Schema } from "./schema.js";

export const SPECIES = ["koi", "betta", "poisson-rouge", "guppy"] as const;

export const fishSchema: Schema = {
  name: text(1, 50),
  species: oneOf(SPECIES),
  breed: optional(text(0, 50)),
  birthDate: optional(isoDate),
  description: optional(text(0, 1000)),
  internalNotes: optional(text(0, 1000)),
};
