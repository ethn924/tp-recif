import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Une seule base de test, partagée : les fichiers s'exécutent l'un après l'autre
    fileParallelism: false,
    // N'affiche la console que pour les tests en échec
    silent: "passed-only",
    env: {
      DB_FILE: "tmp/test.db",
      ADMIN_API_KEY: "recif-secret",
      NOTIFIER: "file",
      OUTBOX_FILE: "tmp/outbox-test.jsonl",
    },
    setupFiles: ["tests/helpers/setup.ts"],
  },
});
