import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { loadEnv } from "./env";

export function connect() {
  loadEnv();
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) throw new Error("Defina DATABASE_URL (ou NETLIFY_DATABASE_URL).");
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  const client = postgres(url, { max: 1, ssl: isLocal ? false : "require", onnotice: () => {} });
  return { db: drizzle(client, { schema }), client };
}
