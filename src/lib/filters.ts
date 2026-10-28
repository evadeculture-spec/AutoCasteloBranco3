import { BODY_KEYS, FUEL_KEYS, GEARBOX_KEYS, type BodyKey, type FuelKey, type GearboxKey } from "./labels";

export const SORT_OPTIONS = {
  recentes: "Mais recentes",
  preco_asc: "Preço: mais baixo",
  preco_desc: "Preço: mais alto",
  km_asc: "Menos quilómetros",
  ano_desc: "Mais novos",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;

export type VehicleFilters = {
  marca?: string;
  modelo?: string;
  precoMin?: number;
  precoMax?: number;
  anoMin?: number;
  anoMax?: number;
  kmMax?: number;
  combustivel: FuelKey[];
  caixa?: GearboxKey;
  tipo: BodyKey[];
  ordem: SortKey;
  pagina: number;
};

export const PAGE_SIZE = 12;

type ParamsLike = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: ParamsLike, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function int(v: string | undefined, min: number, max: number): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

function list<T extends string>(v: string | undefined, allowed: readonly T[]): T[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is T => (allowed as readonly string[]).includes(x));
}

export function parseFilters(params: ParamsLike): VehicleFilters {
  const ordem = read(params, "ordem");
  const caixa = read(params, "caixa");
  return {
    marca: read(params, "marca")?.slice(0, 40) || undefined,
    modelo: read(params, "modelo")?.slice(0, 60) || undefined,
    precoMin: int(read(params, "preco_min"), 0, 1_000_000),
    precoMax: int(read(params, "preco_max"), 0, 1_000_000),
    anoMin: int(read(params, "ano_min"), 1980, 2100),
    anoMax: int(read(params, "ano_max"), 1980, 2100),
    kmMax: int(read(params, "km_max"), 0, 2_000_000),
    combustivel: list(read(params, "combustivel"), FUEL_KEYS),
    caixa: caixa && (GEARBOX_KEYS as string[]).includes(caixa) ? (caixa as GearboxKey) : undefined,
    tipo: list(read(params, "tipo"), BODY_KEYS),
    ordem: ordem && ordem in SORT_OPTIONS ? (ordem as SortKey) : "recentes",
    pagina: int(read(params, "pagina"), 1, 1000) ?? 1,
  };
}

/** Serializa para query string (ordem estável → URLs partilháveis e cache consistente). */
export function filtersToSearchParams(f: Partial<VehicleFilters>): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.marca) sp.set("marca", f.marca);
  if (f.modelo) sp.set("modelo", f.modelo);
  if (f.precoMin != null) sp.set("preco_min", String(f.precoMin));
  if (f.precoMax != null) sp.set("preco_max", String(f.precoMax));
  if (f.anoMin != null) sp.set("ano_min", String(f.anoMin));
  if (f.anoMax != null) sp.set("ano_max", String(f.anoMax));
  if (f.kmMax != null) sp.set("km_max", String(f.kmMax));
  if (f.combustivel?.length) sp.set("combustivel", [...f.combustivel].sort().join(","));
  if (f.caixa) sp.set("caixa", f.caixa);
  if (f.tipo?.length) sp.set("tipo", [...f.tipo].sort().join(","));
  if (f.ordem && f.ordem !== "recentes") sp.set("ordem", f.ordem);
  if (f.pagina && f.pagina > 1) sp.set("pagina", String(f.pagina));
  return sp;
}

export function filtersHref(f: Partial<VehicleFilters>): string {
  const qs = filtersToSearchParams(f).toString();
  return qs ? `/viaturas?${qs}` : "/viaturas";
}

export function countActiveFilters(f: VehicleFilters): number {
  return (
    (f.marca ? 1 : 0) +
    (f.modelo ? 1 : 0) +
    (f.precoMin != null || f.precoMax != null ? 1 : 0) +
    (f.anoMin != null || f.anoMax != null ? 1 : 0) +
    (f.kmMax != null ? 1 : 0) +
    (f.combustivel.length ? 1 : 0) +
    (f.caixa ? 1 : 0) +
    (f.tipo.length ? 1 : 0)
  );
}

export const EMPTY_FILTERS: VehicleFilters = { combustivel: [], tipo: [], ordem: "recentes", pagina: 1 };
