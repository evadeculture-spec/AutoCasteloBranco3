import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidateVehicles } from "@/lib/revalidate";
import { extFor, MAX_IMAGE_BYTES, putFile, sniffImageType } from "@/lib/storage";

/** Upload de uma fotografia (o cliente envia uma de cada vez, já redimensionada). */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await ctx.params;
  const [vehicle] = await db.select({ id: schema.vehicles.id, brand: schema.vehicles.brand, model: schema.vehicles.model }).from(schema.vehicles).where(eq(schema.vehicles.id, id));
  if (!vehicle) return Response.json({ error: "Viatura não encontrada" }, { status: 404 });

  const fd = await request.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Ficheiro em falta" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: "Ficheiro maior que 5 MB" }, { status: 413 });
  const buf = await file.arrayBuffer();
  const type = sniffImageType(buf);
  if (!type) return Response.json({ error: "Formato não suportado (JPG, PNG, WebP, AVIF)" }, { status: 415 });

  const width = Number(fd.get("width")) || null;
  const height = Number(fd.get("height")) || null;
  const key = `vehicles/${id}/${randomUUID()}.${extFor(type)}`;
  await putFile(key, buf, type);

  const [{ max, count } = { max: -1, count: 0 }] = await db
    .select({ max: sql<number>`coalesce(max(${schema.vehicleImages.position}), -1)::int`, count: sql<number>`count(*)::int` })
    .from(schema.vehicleImages)
    .where(eq(schema.vehicleImages.vehicleId, id));
  const [img] = await db
    .insert(schema.vehicleImages)
    .values({
      vehicleId: id,
      storageKey: key,
      url: `/api/media/${key}`,
      alt: `${vehicle.brand} ${vehicle.model} — fotografia ${count + 1}`,
      width,
      height,
      position: max + 1,
      isCover: count === 0,
    })
    .returning();
  revalidateVehicles();
  return Response.json({ image: img });
}
