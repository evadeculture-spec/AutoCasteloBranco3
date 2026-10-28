import "server-only";
import { lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Rate limit por janela fixa, persistido em Postgres (funciona em funções serverless
 * com várias instâncias). Devolve true se o pedido é permitido.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [schema.rateLimits.key, schema.rateLimits.windowStart],
      set: { count: sql`${schema.rateLimits.count} + 1` },
    })
    .returning({ count: schema.rateLimits.count });
  // Limpeza ocasional de janelas antigas
  if (Math.random() < 0.05) {
    await db.delete(schema.rateLimits).where(lt(schema.rateLimits.windowStart, new Date(now - 86400_000)));
  }
  return (row?.count ?? 0) <= limit;
}
