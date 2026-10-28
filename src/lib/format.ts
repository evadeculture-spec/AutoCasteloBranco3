/**
 * Formatação PT-PT. Usamos espaço fino inquebrável (U+202F) como separador de milhares
 * — o Intl "pt-PT" não agrupa números de 4 dígitos, por isso formatamos à mão.
 */
const NBSP = " ";
const THIN = " ";

export function formatNumber(n: number): string {
  const sign = n < 0 ? "-" : "";
  const [int, dec] = Math.abs(n).toString().split(".");
  const grouped = (int ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return sign + grouped + (dec ? "," + dec : "");
}

export function formatPrice(n: number): string {
  return `${formatNumber(Math.round(n))}${NBSP}€`;
}

export function formatPriceCents(n: number): string {
  const fixed = n.toFixed(2);
  const [int, dec] = fixed.split(".");
  return `${formatNumber(Number(int))},${dec}${NBSP}€`;
}

export function formatKm(n: number): string {
  return `${formatNumber(n)}${NBSP}km`;
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits).replace(".", ",")}${NBSP}%`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** dd/mm/aaaa — aceita Date ou string ISO (aaaa-mm-dd). */
export function formatDate(d: Date | string): string {
  if (typeof d === "string") {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    d = new Date(d);
  }
  const parts = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")}`;
}

export function formatDateTime(d: Date): string {
  const time = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${formatDate(d)} ${time}`;
}

const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "seg, 03 nov" para um dia ISO aaaa-mm-dd */
export function formatDayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return `${WEEKDAYS_SHORT[date.getUTCDay()]}, ${pad(d!)} ${MONTHS[m! - 1]}`;
}

export function monthYear(year: number, month: number | null | undefined): string {
  return month ? `${pad(month)}/${year}` : String(year);
}

/** Data de hoje em Lisboa no formato aaaa-mm-dd */
export function todayLisbon(): string {
  return isoDayLisbon(new Date());
}

export function isoDayLisbon(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts; // en-CA → aaaa-mm-dd
}

export function nowLisbonMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + days));
  return date.toISOString().slice(0, 10);
}

export function weekdayOfIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export function vehicleTitle(v: { brand: string; model: string }): string {
  return `${v.brand} ${v.model}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
