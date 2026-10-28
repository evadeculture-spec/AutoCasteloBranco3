import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { isoDayLisbon } from "@/lib/format";
import { getClientIp, hashValue } from "@/lib/request";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 400 });
  const ua = request.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|lighthouse|headless/i.test(ua)) return new Response(null, { status: 204 });
  const [vehicle] = await db
    .select({ id: schema.vehicles.id })
    .from(schema.vehicles)
    .where(and(eq(schema.vehicles.id, id), inArray(schema.vehicles.status, ["disponivel", "reservado"])));
  if (!vehicle) return new Response(null, { status: 404 });
  const visitorHash = hashValue(`${await getClientIp()}|${ua}`);
  const inserted = await db
    .insert(schema.vehicleViews)
    .values({ vehicleId: id, day: isoDayLisbon(new Date()), visitorHash })
    .onConflictDoNothing()
    .returning({ id: schema.vehicleViews.vehicleId });
  if (inserted.length) {
    await db.update(schema.vehicles).set({ viewsCount: sql`${schema.vehicles.viewsCount} + 1`, updatedAt: sql`${schema.vehicles.updatedAt}` }).where(eq(schema.vehicles.id, id));
  }
  return new Response(null, { status: 204 });
}
