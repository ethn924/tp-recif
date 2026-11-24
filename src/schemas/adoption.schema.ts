import {
  isoDate,
  oneOf,
  optional,
  text,
  email,
  type Schema,
} from "./schema.js";

export const adoptionSchema: Schema = {
  name: text(1, 80),
  mail: email,
  message: text(1, 500),
};
