import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, ne, sql, type SQL } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";
import type { HistoryEntry } from "@/db/schema";
import { PAGE_SIZE, type VehicleFilters } from "./filters";
import type { BodyKey, FeatureCategoryKey, FuelKey, GearboxKey, StatusKey } from "./labels";

const { vehicles, vehicleImages, vehicleFeatures } = schema;

export const VEHICLES_TAG = "vehicles";
export const PUBLIC_STATUSES: StatusKey[] = ["disponivel", "reservado"];

export type VehicleCard = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  month: number | null;
  km: number;
  price: number;
  previousPrice: number | null;
  fuel: FuelKey;
  gearbox: GearboxKey;
  bodyType: BodyKey;
  powerHp: number | null;
  status: StatusKey;
  warrantyMonths: number;
  revised: boolean;
  vatDeductible: boolean;
  cover: { url: string; alt: string } | null;
};

export type VehicleSpec = VehicleCard & {
  engineCc: number | null;
  batteryKwh: number | null;
  rangeKm: number | null;
  doors: number | null;
  seats: number | null;
  color: string;
  consumption: string;
  co2: number | null;
  owners: number | null;
};

export type VehicleDetail = VehicleSpec & {
  description: string;
  history: HistoryEntry[];
  images: { id: string; url: string; alt: string; width: number | null; height: number | null }[];
  features: { category: FeatureCategoryKey; label: string }[];
  updatedAt: string;
  publishedAt: string | null;
};

const cardColumns = {
  id: vehicles.id,
  slug: vehicles.slug,
  brand: vehicles.brand,
  model: vehicles.model,
  version: vehicles.version,
  year: vehicles.year,
  month: vehicles.month,
  km: vehicles.km,
  price: vehicles.price,
  previousPrice: vehicles.previousPrice,
  fuel: vehicles.fuel,
  gearbox: vehicles.gearbox,
  bodyType: vehicles.bodyType,
  powerHp: vehicles.powerHp,
  status: vehicles.status,
  warrantyMonths: vehicles.warrantyMonths,
  revised: vehicles.revised,
  vatDeductible: vehicles.vatDeductible,
  coverUrl: sql<string | null>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = "vehicles"."id" ORDER BY vi.is_cover DESC, vi.position ASC LIMIT 1)`,
  coverAlt: sql<string | null>`(SELECT alt FROM vehicle_images vi WHERE vi.vehicle_id = "vehicles"."id" ORDER BY vi.is_cover DESC, vi.position ASC LIMIT 1)`,
};

const specColumns = {
  ...cardColumns,
  engineCc: vehicles.engineCc,
  batteryKwh: vehicles.batteryKwh,
  rangeKm: vehicles.rangeKm,
  doors: vehicles.doors,
  seats: vehicles.seats,
  color: vehicles.color,
  consumption: vehicles.consumption,
  co2: vehicles.co2,
  owners: vehicles.owners,
};

type CardRow = { coverUrl: string | null; coverAlt: string | null } & Omit<VehicleCard, "cover">;

function toCard<T extends CardRow>(row: T): Omit<T, "coverUrl" | "coverAlt"> & { cover: VehicleCard["cover"] } {
  const { coverUrl, coverAlt, ...rest } = row;
  return { ...rest, cover: coverUrl ? { url: coverUrl, alt: coverAlt ?? `${row.brand} ${row.model}` } : null };
}

function whereFor(f: Partial<VehicleFilters>): SQL | undefined {
  const conds: SQL[] = [inArray(vehicles.status, PUBLIC_STATUSES)];
  if (f.marca) conds.push(eq(vehicles.brand, f.marca));
  if (f.modelo) conds.push(eq(vehicles.model, f.modelo));
  if (f.precoMin != null) conds.push(gte(vehicles.price, f.precoMin));
  if (f.precoMax != null) conds.push(lte(vehicles.price, f.precoMax));
  if (f.anoMin != null) conds.push(gte(vehicles.year, f.anoMin));
  if (f.anoMax != null) conds.push(lte(vehicles.year, f.anoMax));
  if (f.kmMax != null) conds.push(lte(vehicles.km, f.kmMax));
  if (f.combustivel?.length) conds.push(inArray(vehicles.fuel, f.combustivel));
  if (f.caixa) conds.push(eq(vehicles.gearbox, f.caixa));
  if (f.tipo?.length) conds.push(inArray(vehicles.bodyType, f.tipo));
  return and(...conds);
}

function orderFor(ordem: VehicleFilters["ordem"]) {
  switch (ordem) {
    case "preco_asc":
      return [asc(vehicles.price), desc(vehicles.publishedAt)];
    case "preco_desc":
      return [desc(vehicles.price), desc(vehicles.publishedAt)];
    case "km_asc":
      return [asc(vehicles.km), desc(vehicles.publishedAt)];
    case "ano_desc":
      return [desc(vehicles.year), desc(vehicles.month), asc(vehicles.km)];
    default:
      // Reservados vão para o fim
      return [sql`CASE WHEN ${vehicles.status} = 'reservado' THEN 1 ELSE 0 END`, desc(vehicles.publishedAt), desc(vehicles.createdAt)];
  }
}

async function _listVehicles(f: VehicleFilters) {
  const where = whereFor(f);
  const [{ total } = { total: 0 }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(where);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.pagina, pages);
  const rows = await db
    .select(cardColumns)
    .from(vehicles)
    .where(where)
    .orderBy(...orderFor(f.ordem))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
  return { items: rows.map(toCard) as VehicleCard[], total, page, pages };
}

export const listVehicles = unstable_cache(_listVehicles, ["vehicles-list"], { tags: [VEHICLES_TAG], revalidate: 600 });

async function _countVehicles(f: Partial<VehicleFilters>) {
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(vehicles).where(whereFor(f));
  return row?.total ?? 0;
}

export const countVehicles = unstable_cache(_countVehicles, ["vehicles-count"], { tags: [VEHICLES_TAG], revalidate: 600 });

export type Facets = {
  brands: { brand: string; count: number; models: { model: string; count: number }[] }[];
  priceMin: number;
  priceMax: number;
  yearMin: number;
  yearMax: number;
  kmMax: number;
  total: number;
};

async function _getFacets(): Promise<Facets> {
  const rows = await db
    .select({ brand: vehicles.brand, model: vehicles.model, count: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(inArray(vehicles.status, PUBLIC_STATUSES))
    .groupBy(vehicles.brand, vehicles.model)
    .orderBy(asc(vehicles.brand), asc(vehicles.model));
  const [range] = await db
    .select({
      priceMin: sql<number>`coalesce(min(${vehicles.price}), 0)::int`,
      priceMax: sql<number>`coalesce(max(${vehicles.price}), 0)::int`,
      yearMin: sql<number>`coalesce(min(${vehicles.year}), 2015)::int`,
      yearMax: sql<number>`coalesce(max(${vehicles.year}), 2025)::int`,
      kmMax: sql<number>`coalesce(max(${vehicles.km}), 0)::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(vehicles)
    .where(inArray(vehicles.status, PUBLIC_STATUSES));
  const map = new Map<string, Facets["brands"][number]>();
  for (const r of rows) {
    const b = map.get(r.brand) ?? { brand: r.brand, count: 0, models: [] };
    b.count += r.count;
    b.models.push({ model: r.model, count: r.count });
    map.set(r.brand, b);
  }
  return {
    brands: [...map.values()],
    priceMin: range?.priceMin ?? 0,
    priceMax: range?.priceMax ?? 0,
    yearMin: range?.yearMin ?? 2015,
    yearMax: range?.yearMax ?? new Date().getFullYear(),
    kmMax: range?.kmMax ?? 0,
    total: range?.total ?? 0,
  };
}

export const getFacets = unstable_cache(_getFacets, ["vehicles-facets"], { tags: [VEHICLES_TAG], revalidate: 600 });

async function _getFeatured(limit: number) {
  const rows = await db
    .select(cardColumns)
    .from(vehicles)
    .where(and(eq(vehicles.status, "disponivel"), eq(vehicles.featured, true)))
    .orderBy(desc(vehicles.publishedAt))
    .limit(limit);
  if (rows.length < limit) {
    const more = await db
      .select(cardColumns)
      .from(vehicles)
      .where(and(eq(vehicles.status, "disponivel"), eq(vehicles.featured, false)))
      .orderBy(desc(vehicles.publishedAt))
      .limit(limit - rows.length);
    rows.push(...more);
  }
  return rows.map(toCard) as VehicleCard[];
}

export const getFeatured = unstable_cache(_getFeatured, ["vehicles-featured"], { tags: [VEHICLES_TAG], revalidate: 600 });

async function _getVehicleBySlug(slug: string): Promise<VehicleDetail | null> {
  const [row] = await db
    .select({ ...specColumns, description: vehicles.description, history: vehicles.history, updatedAt: vehicles.updatedAt, publishedAt: vehicles.publishedAt })
    .from(vehicles)
    .where(and(eq(vehicles.slug, slug), inArray(vehicles.status, PUBLIC_STATUSES)));
  if (!row) return null;
  const [images, features] = await Promise.all([
    db
      .select({ id: vehicleImages.id, url: vehicleImages.url, alt: vehicleImages.alt, width: vehicleImages.width, height: vehicleImages.height })
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, row.id))
      .orderBy(desc(vehicleImages.isCover), asc(vehicleImages.position)),
    db
      .select({ category: vehicleFeatures.category, label: vehicleFeatures.label })
      .from(vehicleFeatures)
      .where(eq(vehicleFeatures.vehicleId, row.id))
      .orderBy(asc(vehicleFeatures.category), asc(vehicleFeatures.position)),
  ]);
  const card = toCard(row);
  return {
    ...card,
    history: [...(row.history ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    images,
    features,
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  } as VehicleDetail;
}

export const getVehicleBySlug = unstable_cache(_getVehicleBySlug, ["vehicle-detail"], { tags: [VEHICLES_TAG], revalidate: 3600 });

async function _getSimilar(id: string, bodyType: BodyKey, price: number, limit: number) {
  const rows = await db
    .select(cardColumns)
    .from(vehicles)
    .where(and(eq(vehicles.status, "disponivel"), ne(vehicles.id, id)))
    .orderBy(
      sql`(CASE WHEN ${vehicles.bodyType} = ${bodyType} THEN 0 ELSE 1 END)`,
      sql`abs(${vehicles.price} - ${price})`,
    )
    .limit(limit);
  return rows.map(toCard) as VehicleCard[];
}

export const getSimilar = unstable_cache(_getSimilar, ["vehicles-similar"], { tags: [VEHICLES_TAG], revalidate: 3600 });

/** Para comparar/favoritos — inclui ficha técnica. */
export async function getVehiclesByIds(ids: string[]): Promise<VehicleSpec[]> {
  const valid = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 50);
  if (!valid.length) return [];
  const rows = await db
    .select(specColumns)
    .from(vehicles)
    .where(and(inArray(vehicles.id, valid), inArray(vehicles.status, PUBLIC_STATUSES)));
  const byId = new Map(rows.map((r) => [r.id, toCard(r) as VehicleSpec]));
  return valid.map((id) => byId.get(id)).filter((v): v is VehicleSpec => Boolean(v));
}

export async function getPublicSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return db
    .select({ slug: vehicles.slug, updatedAt: vehicles.updatedAt })
    .from(vehicles)
    .where(inArray(vehicles.status, PUBLIC_STATUSES));
}

export const listPublicOptions = unstable_cache(
  async () =>
    db
      .select({ brand: vehicles.brand, model: vehicles.model, version: vehicles.version, year: vehicles.year })
      .from(vehicles)
      .where(eq(vehicles.status, "disponivel"))
      .orderBy(asc(vehicles.brand), asc(vehicles.model)),
  ["vehicles-options"],
  { tags: [VEHICLES_TAG], revalidate: 600 },
);
