import type { BodyKey, FuelKey, GearboxKey } from "./labels";
import type { VehicleFilters } from "./filters";

/**
 * Interpreta texto livre em português ("Procuro um SUV gasóleo até 20 000 €")
 * e converte-o em filtros estruturados. Funciona no cliente e no servidor.
 */

export type ParsedQuery = Partial<Omit<VehicleFilters, "ordem" | "pagina">> & { unmatched: string[] };

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const BODY_WORDS: [RegExp, BodyKey[]][] = [
  [/\bsuvs?\b|\bjipes?\b|\bcrossovers?\b|\btodo[- ]o[- ]terreno\b/, ["suv"]],
  [/\bcitadinos?\b|\bpequenos?\b|\bcidade\b/, ["citadino"]],
  [/\butilitarios?\b|\bhatchbacks?\b|\bcompactos?\b/, ["utilitario"]],
  [/\bcarrinhas?\b|\bstation\b|\btouring\b|\bsw\b|\bbreak\b/, ["carrinha"]],
  [/\bmonovolumes?\b|\b7 lugares\b|\bsete lugares\b/, ["monovolume"]],
  [/\bfamiliar(es)?\b|\bfamilia\b/, ["carrinha", "monovolume"]],
  [/\bberlinas?\b|\bsedans?\b/, ["berlina"]],
  [/\bcoupes?\b|\bdesportivos?\b/, ["coupe"]],
  [/\bcomerciais?\b|\bfurg(ao|oes|oneta)\b|\bvan\b/, ["comercial"]],
];

const FUEL_WORDS: [RegExp, FuelKey[]][] = [
  [/\bplug[- ]?in\b|\bphev\b/, ["hibrido_plugin"]],
  [/\bhibridos?\b|\bhybrid\b/, ["hibrido", "hibrido_plugin"]],
  [/\beletricos?\b|\beletric\w*\b|\bev\b|\b100 ?% eletrico\b/, ["eletrico"]],
  [/\bgasoleo\b|\bdiesel\b|\btdi\b|\bhdi\b|\bdci\b/, ["gasoleo"]],
  [/\bgasolina\b/, ["gasolina"]],
  [/\bgpl\b|\bbi-?fuel\b/, ["gpl"]],
];

const GEAR_WORDS: [RegExp, GearboxKey][] = [
  [/\bautomatic[oa]s?\b|\bcaixa automatica\b|\bauto\b|\bdsg\b/, "automatica"],
  [/\bmanua(l|is)\b/, "manual"],
];

/** "20 000", "20.000", "20k", "20 mil" → 20000 */
function parseAmount(raw: string): number | null {
  const s = raw.replace(/\s| | /g, "").replace(/€|eur(os)?/g, "");
  const k = s.match(/^(\d+(?:[.,]\d+)?)(k|mil)$/);
  if (k) return Math.round(Number(k[1]!.replace(",", ".")) * 1000);
  const n = Number(s.replace(/[.,](?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const AMOUNT = String.raw`(\d{1,3}(?:[\s.  ]?\d{3})*(?:[.,]\d+)?\s?(?:k\b|mil\b)?)\s?(?:€|euros?|eur)?`;

export function parseSmartQuery(input: string, knownBrands: string[] = [], knownModels: { brand: string; model: string }[] = []): ParsedQuery {
  const original = input.trim();
  let q = " " + norm(original) + " ";
  const out: ParsedQuery = { unmatched: [] };

  const take = (re: RegExp) => {
    q = q.replace(re, " ");
  };

  // Marca e modelo
  const sortedModels = [...knownModels].sort((a, b) => b.model.length - a.model.length);
  for (const m of sortedModels) {
    const re = new RegExp(`\\b${norm(m.model).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(q) && (!out.marca || out.marca === m.brand)) {
      out.marca = m.brand;
      out.modelo = m.model;
      take(re);
      break;
    }
  }
  const brandAliases: Record<string, string> = { vw: "Volkswagen", mercedes: "Mercedes-Benz", "mercedes-benz": "Mercedes-Benz", citroen: "Citroën" };
  for (const [alias, brand] of Object.entries(brandAliases)) {
    const re = new RegExp(`\\b${alias}\\b`);
    if (re.test(q) && knownBrands.includes(brand)) {
      out.marca ??= brand;
      take(re);
    }
  }
  for (const b of [...knownBrands].sort((a, z) => z.length - a.length)) {
    const re = new RegExp(`\\b${norm(b).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(q)) {
      out.marca ??= b;
      take(re);
    }
  }

  // Quilómetros
  const km = new RegExp(String.raw`(?:ate|menos de|max(?:imo)?|abaixo de)?\s*(\d{1,3}(?:[\s.  ]?\d{3})*\s?(?:k|mil)?)\s?km`);
  const mk = q.match(km);
  if (mk) {
    const n = parseAmount(mk[1]!);
    if (n != null && n > 0) {
      out.kmMax = n;
      take(km);
    }
  }
  if (/\bpoucos (km|quilometros)\b/.test(q)) {
    out.kmMax ??= 50000;
    take(/\bpoucos (km|quilometros)\b/);
  }

  // Preço
  const between = new RegExp(String.raw`entre\s+${AMOUNT}\s+e\s+${AMOUNT}`);
  const mb = q.match(between);
  if (mb) {
    const a = parseAmount(mb[1]!);
    const b = parseAmount(mb[2]!);
    if (a != null && b != null && b > 1000) {
      out.precoMin = Math.min(a, b) < 1000 ? Math.min(a, b) * 1000 : Math.min(a, b);
      out.precoMax = Math.max(a, b);
      take(between);
    }
  }
  const maxPrice = new RegExp(String.raw`(?:ate|max(?:imo)?|menos de|abaixo de|nao mais de|<=?)\s+(?:aos?\s+)?${AMOUNT}(?!\s?km)`);
  const mp = q.match(maxPrice);
  if (mp) {
    const n = parseAmount(mp[1]!);
    if (n != null && n >= 1000) {
      out.precoMax = n;
      take(maxPrice);
    }
  }
  const minPrice = new RegExp(String.raw`(?:a partir de|desde|mais de|acima de)\s+${AMOUNT}(?!\s?km)`);
  const mn = q.match(minPrice);
  if (mn) {
    const n = parseAmount(mn[1]!);
    if (n != null && n >= 1000 && n < 1_000_000 && !(n >= 1980 && n <= 2100)) {
      out.precoMin = n;
      take(minPrice);
    }
  }
  if (/\bbarato|economico\b/.test(q) && out.precoMax == null) {
    out.precoMax = 15000;
  }

  // Ano
  const yearFrom = q.match(/(?:desde|a partir de|de|depois de|posterior a|>=?)\s*(19[89]\d|20\d{2})\b/);
  if (yearFrom) {
    out.anoMin = Number(yearFrom[1]);
    take(/(?:desde|a partir de|de|depois de|posterior a|>=?)\s*(19[89]\d|20\d{2})\b/);
  }
  const yearTo = q.match(/(?:ate|antes de)\s*(19[89]\d|20\d{2})\b/);
  if (yearTo) {
    out.anoMax = Number(yearTo[1]);
    take(/(?:ate|antes de)\s*(19[89]\d|20\d{2})\b/);
  }
  const yearAlone = q.match(/\b(19[89]\d|20[0-3]\d)\b/);
  if (yearAlone && out.anoMin == null && out.anoMax == null) {
    out.anoMin = Number(yearAlone[1]);
    take(/\b(19[89]\d|20[0-3]\d)\b/);
  }
  if (/\b(recentes?|novos?|seminovos?)\b/.test(q) && out.anoMin == null) {
    out.anoMin = new Date().getFullYear() - 4;
  }

  // Tipologia, combustível, caixa
  const tipo = new Set<BodyKey>();
  for (const [re, keys] of BODY_WORDS) {
    if (re.test(q)) {
      keys.forEach((k) => tipo.add(k));
      take(re);
    }
  }
  if (tipo.size) out.tipo = [...tipo];
  const fuel = new Set<FuelKey>();
  for (const [re, keys] of FUEL_WORDS) {
    if (re.test(q)) {
      keys.forEach((k) => fuel.add(k));
      take(re);
    }
  }
  if (fuel.size) out.combustivel = [...fuel];
  for (const [re, key] of GEAR_WORDS) {
    if (re.test(q)) {
      out.caixa = key;
      take(re);
      break;
    }
  }

  const STOP = new Set(["procuro", "quero", "um", "uma", "uns", "umas", "o", "a", "os", "as", "de", "do", "da", "com", "e", "ou", "para", "por", "carro", "carros", "viatura", "viaturas", "automovel", "caixa", "preco", "euros", "€", "ate", "em", "no", "na", "que", "seja", "bom", "boa", "algo", "tipo", "tem", "ter", "gostava", "preciso", "me", "motor"]);
  out.unmatched = q
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
  return out;
}
