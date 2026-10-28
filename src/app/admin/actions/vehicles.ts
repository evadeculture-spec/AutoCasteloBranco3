"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { vehicleAdminSchema } from "@/lib/admin-schemas";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { FEATURE_CATEGORY_KEYS, STATUS_KEYS, type StatusKey } from "@/lib/labels";
import { revalidateVehicles } from "@/lib/revalidate";
import { formDataToObject, zodErrors, type ActionResult } from "@/lib/schemas";
import { deleteFile, getFile, putFile } from "@/lib/storage";

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "viatura";
  let slug = root;
  for (let i = 2; i < 100; i++) {
    const [hit] = await db
      .select({ id: schema.vehicles.id })
      .from(schema.vehicles)
      .where(excludeId ? and(eq(schema.vehicles.slug, slug), ne(schema.vehicles.id, excludeId)) : eq(schema.vehicles.slug, slug));
    if (!hit) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${randomUUID().slice(0, 6)}`;
}

function featuresFrom(fd: FormData) {
  return FEATURE_CATEGORY_KEYS.flatMap((category) =>
    String(fd.get(`features_${category}`) ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 60)
      .map((label, position) => ({ category, label: label.slice(0, 120), position })),
  );
}

export async function saveVehicle(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = vehicleAdminSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { ok: false, message: "Verifique os campos assinalados.", errors: zodErrors(parsed.error) };
  const { id, slug: rawSlug, ...d } = parsed.data;
  const features = featuresFrom(fd);
  const values = {
    ...d,
    status: d.status as StatusKey,
    fuel: d.fuel as typeof schema.vehicles.$inferInsert.fuel,
    gearbox: d.gearbox as typeof schema.vehicles.$inferInsert.gearbox,
    bodyType: d.bodyType as typeof schema.vehicles.$inferInsert.bodyType,
  };

  if (id) {
    const [existing] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (!existing) return { ok: false, message: "Viatura não encontrada." };
    const slug = await uniqueSlug(rawSlug || `${d.brand} ${d.model} ${d.version} ${d.year}`, id);
    await db.transaction(async (tx) => {
      await tx
        .update(schema.vehicles)
        .set({
          ...values,
          slug,
          publishedAt: existing.publishedAt ?? (values.status === "disponivel" ? new Date() : null),
          soldAt: values.status === "vendido" ? (existing.soldAt ?? new Date()) : null,
        })
        .where(eq(schema.vehicles.id, id));
      await tx.delete(schema.vehicleFeatures).where(eq(schema.vehicleFeatures.vehicleId, id));
      if (features.length) await tx.insert(schema.vehicleFeatures).values(features.map((f) => ({ ...f, vehicleId: id })));
    });
    revalidateVehicles();
    return { ok: true, message: "Alterações guardadas." };
  }

  const slug = await uniqueSlug(rawSlug || `${d.brand} ${d.model} ${d.version} ${d.year}`);
  const [created] = await db
    .insert(schema.vehicles)
    .values({ ...values, slug, publishedAt: values.status === "disponivel" ? new Date() : null, soldAt: values.status === "vendido" ? new Date() : null })
    .returning({ id: schema.vehicles.id });
  if (features.length) await db.insert(schema.vehicleFeatures).values(features.map((f) => ({ ...f, vehicleId: created!.id })));
  revalidateVehicles();
  redirect(`/admin/viaturas/${created!.id}?criada=1#fotos`);
}

export async function setVehicleStatus(id: string, status: StatusKey) {
  await requireAdmin();
  if (!STATUS_KEYS.includes(status)) return;
  const [v] = await db.select({ publishedAt: schema.vehicles.publishedAt }).from(schema.vehicles).where(eq(schema.vehicles.id, id));
  if (!v) return;
  await db
    .update(schema.vehicles)
    .set({ status, soldAt: status === "vendido" ? new Date() : null, publishedAt: v.publishedAt ?? (status === "disponivel" ? new Date() : null) })
    .where(eq(schema.vehicles.id, id));
  revalidateVehicles();
}

export async function toggleFeatured(id: string, featured: boolean) {
  await requireAdmin();
  await db.update(schema.vehicles).set({ featured }).where(eq(schema.vehicles.id, id));
  revalidateVehicles();
}

export async function duplicateVehicle(id: string) {
  await requireAdmin();
  const [v] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
  if (!v) return;
  const { id: _id, slug: _s, createdAt: _c, updatedAt: _u, viewsCount: _v, publishedAt: _p, soldAt: _so, ...rest } = v;
  void _id; void _s; void _c; void _u; void _v; void _p; void _so;
  const slug = await uniqueSlug(`${v.brand} ${v.model} ${v.version} ${v.year} copia`);
  const [copy] = await db.insert(schema.vehicles).values({ ...rest, slug, status: "rascunho", featured: false }).returning({ id: schema.vehicles.id });
  const newId = copy!.id;
  const feats = await db.select().from(schema.vehicleFeatures).where(eq(schema.vehicleFeatures.vehicleId, id));
  if (feats.length) await db.insert(schema.vehicleFeatures).values(feats.map((f) => ({ vehicleId: newId, category: f.category, label: f.label, position: f.position })));
  const imgs = await db.select().from(schema.vehicleImages).where(eq(schema.vehicleImages.vehicleId, id)).orderBy(asc(schema.vehicleImages.position));
  for (const img of imgs) {
    let storageKey: string | null = null;
    let url = img.url;
    if (img.storageKey) {
      // Copia o ficheiro para que apagar uma viatura não afete a outra
      const file = await getFile(img.storageKey);
      if (!file) continue;
      storageKey = `vehicles/${newId}/${randomUUID()}.${img.storageKey.split(".").pop()}`;
      await putFile(storageKey, file.data, file.contentType);
      url = `/api/media/${storageKey}`;
    }
    await db.insert(schema.vehicleImages).values({ vehicleId: newId, storageKey, url, alt: img.alt, width: img.width, height: img.height, position: img.position, isCover: img.isCover });
  }
  revalidateVehicles();
  redirect(`/admin/viaturas/${newId}?duplicada=1`);
}

export async function deleteVehicle(id: string) {
  await requireAdmin();
  const imgs = await db.select({ key: schema.vehicleImages.storageKey }).from(schema.vehicleImages).where(eq(schema.vehicleImages.vehicleId, id));
  await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));
  await Promise.all(imgs.filter((i) => i.key).map((i) => deleteFile(i.key!).catch(() => {})));
  revalidateVehicles();
  redirect("/admin/viaturas?apagada=1");
}

// ——— Imagens ———

export async function reorderImages(vehicleId: string, orderedIds: string[]) {
  await requireAdmin();
  const imgs = await db.select({ id: schema.vehicleImages.id }).from(schema.vehicleImages).where(eq(schema.vehicleImages.vehicleId, vehicleId));
  const valid = new Set(imgs.map((i) => i.id));
  const ids = orderedIds.filter((x) => valid.has(x));
  await db.transaction(async (tx) => {
    for (const [position, id] of ids.entries()) {
      await tx.update(schema.vehicleImages).set({ position }).where(eq(schema.vehicleImages.id, id));
    }
  });
  revalidateVehicles();
}

export async function setCoverImage(vehicleId: string, imageId: string) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    await tx.update(schema.vehicleImages).set({ isCover: false }).where(eq(schema.vehicleImages.vehicleId, vehicleId));
    await tx.update(schema.vehicleImages).set({ isCover: true }).where(and(eq(schema.vehicleImages.id, imageId), eq(schema.vehicleImages.vehicleId, vehicleId)));
  });
  revalidateVehicles();
}

export async function updateImageAlt(vehicleId: string, imageId: string, alt: string) {
  await requireAdmin();
  await db.update(schema.vehicleImages).set({ alt: alt.trim().slice(0, 200) }).where(and(eq(schema.vehicleImages.id, imageId), eq(schema.vehicleImages.vehicleId, vehicleId)));
  revalidateVehicles();
}

export async function deleteImages(vehicleId: string, imageIds: string[]) {
  await requireAdmin();
  if (!imageIds.length) return;
  const rows = await db
    .delete(schema.vehicleImages)
    .where(and(eq(schema.vehicleImages.vehicleId, vehicleId), inArray(schema.vehicleImages.id, imageIds)))
    .returning({ key: schema.vehicleImages.storageKey, isCover: schema.vehicleImages.isCover });
  await Promise.all(rows.filter((r) => r.key).map((r) => deleteFile(r.key!).catch(() => {})));
  if (rows.some((r) => r.isCover)) {
    const [first] = await db.select({ id: schema.vehicleImages.id }).from(schema.vehicleImages).where(eq(schema.vehicleImages.vehicleId, vehicleId)).orderBy(asc(schema.vehicleImages.position)).limit(1);
    if (first) await db.update(schema.vehicleImages).set({ isCover: true }).where(eq(schema.vehicleImages.id, first.id));
  }
  revalidateVehicles();
}
