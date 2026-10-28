"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { BOOKING_STATUS_KEYS, type BookingStatusKey } from "@/lib/labels";
import { revalidateWorkshop } from "@/lib/revalidate";
import { formDataToObject, zodErrors, type ActionResult } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function setBookingStatus(id: string, status: BookingStatusKey) {
  await requireAdmin();
  if (!BOOKING_STATUS_KEYS.includes(status)) return;
  await db.update(schema.workshopBookings).set({ status }).where(eq(schema.workshopBookings.id, id));
  revalidatePath("/admin", "layout");
}

export async function saveBookingNotes(id: string, internalNotes: string) {
  await requireAdmin();
  await db.update(schema.workshopBookings).set({ internalNotes: internalNotes.slice(0, 2000) }).where(eq(schema.workshopBookings.id, id));
  revalidatePath("/admin/oficina");
}

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Indique o nome.").max(80),
  description: z.string().trim().max(500).default(""),
  priceFrom: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(0).max(100000).nullable()),
  durationMinutes: z.coerce.number().int().min(15, "Mínimo 15 min.").max(600),
  position: z.coerce.number().int().min(0).max(999).default(0),
  active: z.preprocess((v) => v === "on", z.boolean()),
});

export async function saveService(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { ok: false, message: "Verifique os campos.", errors: zodErrors(parsed.error) };
  const { id, ...d } = parsed.data;
  if (id) {
    await db.update(schema.workshopServices).set(d).where(eq(schema.workshopServices.id, id));
  } else {
    let slug = slugify(d.name) || "servico";
    const [hit] = await db.select({ id: schema.workshopServices.id }).from(schema.workshopServices).where(eq(schema.workshopServices.slug, slug));
    if (hit) slug = `${slug}-${Date.now().toString(36)}`;
    await db.insert(schema.workshopServices).values({ ...d, slug });
  }
  revalidateWorkshop();
  return { ok: true, message: id ? "Serviço atualizado." : "Serviço criado." };
}

export async function deleteService(id: string) {
  await requireAdmin();
  await db.delete(schema.workshopServices).where(eq(schema.workshopServices.id, id));
  revalidateWorkshop();
}

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM).");
const dayCfg = z
  .object({
    isOpen: z.boolean(),
    openTime: hhmm,
    closeTime: hhmm,
    breakStart: z.union([z.literal(""), hhmm]),
    breakEnd: z.union([z.literal(""), hhmm]),
    slotMinutes: z.coerce.number().int().min(15).max(480),
    capacity: z.coerce.number().int().min(0).max(50),
  })
  .refine((d) => !d.isOpen || d.openTime < d.closeTime, { message: "A hora de fecho tem de ser posterior à abertura." })
  .refine((d) => (d.breakStart === "") === (d.breakEnd === "") && (d.breakStart === "" || d.breakStart < d.breakEnd), { message: "Pausa inválida." });

export async function saveSlotsConfig(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const errors: Record<string, string> = {};
  const rows: (typeof schema.workshopSlotsConfig.$inferInsert)[] = [];
  for (let wd = 0; wd < 7; wd++) {
    const r = dayCfg.safeParse({
      isOpen: fd.get(`open_${wd}`) === "on",
      openTime: fd.get(`openTime_${wd}`),
      closeTime: fd.get(`closeTime_${wd}`),
      breakStart: fd.get(`breakStart_${wd}`) ?? "",
      breakEnd: fd.get(`breakEnd_${wd}`) ?? "",
      slotMinutes: fd.get(`slot_${wd}`),
      capacity: fd.get(`capacity_${wd}`),
    });
    if (!r.success) {
      errors[`day_${wd}`] = r.error.issues[0]?.message ?? "Inválido";
      continue;
    }
    rows.push({ weekday: wd, ...r.data, breakStart: r.data.breakStart || null, breakEnd: r.data.breakEnd || null });
  }
  if (Object.keys(errors).length) return { ok: false, message: "Corrija os dias assinalados.", errors };
  await db.transaction(async (tx) => {
    for (const row of rows) {
      await tx
        .insert(schema.workshopSlotsConfig)
        .values(row)
        .onConflictDoUpdate({ target: schema.workshopSlotsConfig.weekday, set: { ...row } });
    }
  });
  revalidateWorkshop();
  return { ok: true, message: "Horário guardado. As vagas públicas foram atualizadas." };
}

export async function addBlockedDay(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const day = String(fd.get("day") ?? "");
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 120);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, message: "Escolha uma data.", errors: { day: "Escolha uma data." } };
  await db.insert(schema.blockedDays).values({ day, reason }).onConflictDoUpdate({ target: schema.blockedDays.day, set: { reason } });
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.workshopBookings)
    .where(and(eq(schema.workshopBookings.day, day), inArray(schema.workshopBookings.status, ["pendente", "confirmada"])));
  revalidateWorkshop();
  return { ok: true, message: n ? `Dia bloqueado. Atenção: existem ${n} marcações ativas nesse dia — contacte os clientes.` : "Dia bloqueado." };
}

export async function removeBlockedDay(day: string) {
  await requireAdmin();
  await db.delete(schema.blockedDays).where(eq(schema.blockedDays.day, day));
  revalidateWorkshop();
}
