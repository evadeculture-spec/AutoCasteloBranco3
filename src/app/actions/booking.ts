"use server";

import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { notifyTeam, sendEmail } from "@/lib/email";
import { guardForm } from "@/lib/form-guard";
import { addDaysIso, formatDate, todayLisbon, weekdayOfIso } from "@/lib/format";
import { bookingSchema, formDataToObject, zodErrors, type ActionResult } from "@/lib/schemas";
import { BOOKING_HORIZON_DAYS, getAvailability, slotTimesFor } from "@/lib/workshop";

function reference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return "OF-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function submitBooking(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const guard = await guardForm(fd, "booking", 4, 900);
  if ("blocked" in guard) return guard.blocked;
  const parsed = bookingSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { ok: false, message: "Verifique os campos assinalados.", errors: zodErrors(parsed.error) };
  const d = parsed.data;

  const today = todayLisbon();
  if (d.day < today || d.day > addDaysIso(today, BOOKING_HORIZON_DAYS)) {
    return { ok: false, message: "Data fora do período de marcações.", errors: { day: "Escolha outra data." } };
  }
  const [service] = await db.select().from(schema.workshopServices).where(and(eq(schema.workshopServices.id, d.serviceId), eq(schema.workshopServices.active, true)));
  if (!service) return { ok: false, message: "Serviço indisponível.", errors: { serviceId: "Escolha outro serviço." } };

  const ref = reference();
  // Transação com lock por (dia, hora): impede que duas pessoas fiquem com a última vaga
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`booking:${d.day}:${d.time}`}))`);
    const [cfg] = await tx.select().from(schema.workshopSlotsConfig).where(eq(schema.workshopSlotsConfig.weekday, weekdayOfIso(d.day)));
    const [blocked] = await tx.select().from(schema.blockedDays).where(eq(schema.blockedDays.day, d.day));
    if (blocked || !slotTimesFor(cfg).includes(d.time)) return "invalid" as const;
    // Respeita também a antecedência mínima no próprio dia
    const avail = await getAvailability(d.day, 1);
    if (!avail[0]?.slots.some((s) => s.time === d.time)) return "invalid" as const;
    const [{ n } = { n: 0 }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.workshopBookings)
      .where(and(eq(schema.workshopBookings.day, d.day), eq(schema.workshopBookings.time, d.time), inArray(schema.workshopBookings.status, ["pendente", "confirmada"])));
    if (n >= (cfg?.capacity ?? 0)) return "full" as const;
    await tx.insert(schema.workshopBookings).values({
      reference: ref,
      serviceId: service.id,
      serviceName: service.name,
      day: d.day,
      time: d.time,
      status: "pendente",
      name: d.name,
      email: d.email,
      phone: d.phone,
      vehicleInfo: d.vehicleInfo,
      plate: d.plate,
      notes: d.notes,
      consentAt: new Date(),
      ipHash: guard.ipHash,
    });
    return "ok" as const;
  });

  if (result === "invalid") return { ok: false, message: "Esse horário não está disponível. Escolha outro.", errors: { time: "Horário indisponível." } };
  if (result === "full") return { ok: false, message: "Essa vaga acabou de ser ocupada. Escolha outra hora.", errors: { time: "Vaga ocupada." } };

  const when = `${formatDate(d.day)} às ${d.time}`;
  await sendEmail({
    to: d.email,
    subject: `Marcação ${ref} — ${service.name} a ${formatDate(d.day)}`,
    text: `Olá ${d.name},\n\nA sua marcação está registada:\n\nServiço: ${service.name}\nData: ${when}\nViatura: ${d.vehicleInfo}${d.plate ? ` (${d.plate})` : ""}\nReferência: ${ref}\n\nSe precisar de alterar, responda a este email ou ligue-nos.\n\nAutoCasteloBranco — Oficina (demonstração)`,
  });
  await notifyTeam(`[Oficina] ${ref} — ${service.name} ${when}`, `${d.name} · ${d.phone} · ${d.email}\nViatura: ${d.vehicleInfo} ${d.plate}\n${d.notes}`, d.email);
  return { ok: true, message: `Marcação registada para ${when}.`, ref };
}
