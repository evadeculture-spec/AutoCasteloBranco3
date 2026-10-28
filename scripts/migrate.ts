import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { loadEnv } from "./env";

loadEnv();

async function main() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    console.warn("[migrate] DATABASE_URL/NETLIFY_DATABASE_URL não definido — migrações ignoradas.");
    return;
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  const client = postgres(url, { max: 1, ssl: isLocal ? false : "require", onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("[migrate] Migrações aplicadas.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
