import { existsSync, readFileSync } from "node:fs";

/** Carrega .env/.env.local sem dependências externas (apenas para scripts CLI). */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, raw] = m;
      if (!key || process.env[key] !== undefined) continue;
      process.env[key] = (raw ?? "").replace(/^"(.*)"$/, "$1");
    }
  }
}
