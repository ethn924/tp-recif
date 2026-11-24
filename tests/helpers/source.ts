// Lecture du code source, pour les tests qui vérifient la structure du projet
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export type SourceFile = { path: string; content: string };

export function sourceFiles(dir = "src"): SourceFile[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name).replaceAll("\\", "/");
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") ? [{ path, content: readFileSync(path, "utf8") }] : [];
  });
}

export const filesContaining = (pattern: RegExp, dir = "src") =>
  sourceFiles(dir).filter((f) => pattern.test(f.content)).map((f) => f.path);
