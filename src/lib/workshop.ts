import "server-only";
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";
import { addDaysIso, nowLisbonMinutes, todayLisbon, weekdayOfIso } from "./format";

export const WORKSHOP_TAG = "workshop";
export const BOOKING_HORIZON_DAYS = 45;
export const MIN_LEAD_MINUTES = 120; // antecedência mínima para marcar no próprio dia

export const getActiveServices = unstable_cache(
  async () =>
    db
      .select({ id: schema.workshopServices.id, slug: schema.workshopServices.slug, name: schema.workshopServices.name, description: schema.workshopServices.description, priceFrom: schema.workshopServices.priceFrom, durationMinutes: schema.workshopServices.durationMinutes })
      .from(schema.workshopServices)
      .where(eq(schema.workshopServices.active, true))
      .orderBy(asc(schema.workshopServices.position), asc(schema.workshopServices.name)),
  ["workshop-services"],
  { tags: [WORKSHOP_TAG], revalidate: 3600 },
);

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
function toHHMM(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export type SlotConfig = typeof schema.workshopSlotsConfig.$inferSelect;

/** Horas de início de slot para um dia, segundo a configuração. */
export function slotTimesFor(cfg: SlotConfig | undefined): string[] {
  if (!cfg || !cfg.isOpen || cfg.slotMinutes <= 0) return [];
  const open = toMin(cfg.openTime);
  const close = toMin(cfg.closeTime);
  const bs = cfg.breakStart ? toMin(cfg.breakStart) : null;
  const be = cfg.breakEnd ? toMin(cfg.breakEnd) : null;
  const out: string[] = [];
  for (let m = open; m + cfg.slotMinutes <= close; m += cfg.slotMinutes) {
    if (bs != null && be != null && m < be && m + cfg.slotMinutes > bs) continue;
    out.push(toHHMM(m));
  }
  return out;
}

export type DayAvailability = { day: string; closed: boolean; reason?: string; slots: { time: string; free: number; capacity: number }[] };

/** Disponibilidade real (configuração − dias bloqueados − marcações ativas). Sem cache: tem de ser exata. */
export async function getAvailability(from: string, days: number): Promise<DayAvailability[]> {
  const to = addDaysIso(from, days - 1);
  const [configs, blocked, bookings] = await Promise.all([
    db.select().from(schema.workshopSlotsConfig),
    db.select().from(schema.blockedDays).where(and(gte(schema.blockedDays.day, from), lte(schema.blockedDays.day, to))),
    db
      .select({ day: schema.workshopBookings.day, time: schema.workshopBookings.time, n: sql<number>`count(*)::int` })
      .from(schema.workshopBookings)
      .where(and(gte(schema.workshopBookings.day, from), lte(schema.workshopBookings.day, to), inArray(schema.workshopBookings.status, ["pendente", "confirmada"])))
      .groupBy(schema.workshopBookings.day, schema.workshopBookings.time),
  ]);
  const cfgByDay = new Map(configs.map((c) => [c.weekday, c]));
  const blockedMap = new Map(blocked.map((b) => [b.day, b.reason]));
  const taken = new Map(bookings.map((b) => [`${b.day} ${b.time}`, b.n]));
  const today = todayLisbon();
  const nowMin = nowLisbonMinutes();
  const out: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDaysIso(from, i);
    const cfg = cfgByDay.get(weekdayOfIso(day));
    if (blockedMap.has(day)) {
      out.push({ day, closed: true, reason: blockedMap.get(day) || "Encerrado", slots: [] });
      continue;
    }
    const times = slotTimesFor(cfg);
    if (!times.length) {
      out.push({ day, closed: true, reason: "Encerrado", slots: [] });
      continue;
    }
    const slots = times
      .filter((t) => day !== today || toMin(t) >= nowMin + MIN_LEAD_MINUTES)
      .map((time) => ({ time, capacity: cfg!.capacity, free: Math.max(0, cfg!.capacity - (taken.get(`${day} ${time}`) ?? 0)) }));
    out.push({ day, closed: slots.length === 0, reason: slots.length ? undefined : "Sem horas disponíveis", slots });
  }
  return out;
}
