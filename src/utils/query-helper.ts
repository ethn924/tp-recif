// Générateur de clause WHERE générique, pour tous les filtres possibles
const OPERATORS: Record<string, string> = {
  eq: "=",
  neq: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "LIKE",
};

export function buildWhere(filters: Record<string, { op: string; value: any }>): string {
  const parts: string[] = [];
  for (const field of Object.keys(filters)) {
    const filter = filters[field];
    const operator = OPERATORS[filter.op];
    if (!operator) throw new Error("Opérateur inconnu : " + filter.op);
    const value = typeof filter.value === "number" ? filter.value : "'" + filter.value + "'";
    parts.push(field + " " + operator + " " + value);
  }
  return parts.length > 0 ? "WHERE " + parts.join(" AND ") : "";
}
