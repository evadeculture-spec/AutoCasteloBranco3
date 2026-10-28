import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || undefined;
}

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __acbDb?: Db; __acbSql?: postgres.Sql };

function createDb(): Db {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL (ou NETLIFY_DATABASE_URL) não está definido.");
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  const client = postgres(url, {
    max: process.env.NODE_ENV === "production" ? 3 : 5,
    idle_timeout: 20,
    prepare: false,
    ssl: isLocal ? false : "require",
    onnotice: () => {},
  });
  globalForDb.__acbSql = client;
  return drizzle(client, { schema });
}

/** Ligação preguiçosa: só liga quando é usada (permite build sem BD). */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    if (!globalForDb.__acbDb) globalForDb.__acbDb = createDb();
    return Reflect.get(globalForDb.__acbDb, prop, receiver);
  },
});

export { schema };
