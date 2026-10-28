"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { LeadData } from "@/db/schema";
import { notifyTeam, sendEmail } from "@/lib/email";
import { guardForm } from "@/lib/form-guard";
import { formatDate, todayLisbon } from "@/lib/format";
import { LEAD_TYPE_LABELS, type LeadTypeKey } from "@/lib/labels";
import { contactSchema, formDataToObject, infoLeadSchema, testDriveSchema, zodErrors, type ActionResult } from "@/lib/schemas";
import { validateTestDrive } from "@/lib/test-drive";

async function vehicleLabel(vehicleId: string) {
  const [v] = await db
    .select({ id: schema.vehicles.id, brand: schema.vehicles.brand, model: schema.vehicles.model, version: schema.vehicles.version, status: schema.vehicles.status })
    .from(schema.vehicles)
    .where(eq(schema.vehicles.id, vehicleId));
  if (!v || v.status === "rascunho" || v.status === "vendido") return null;
  return `${v.brand} ${v.model} ${v.version}`.trim();
}

async function saveLead(input: {
  type: LeadTypeKey;
  name: string;
  email: string;
  phone: string;
  message: string;
  vehicleId?: string | null;
  vehicleLabel?: string | null;
  data?: LeadData;
  ipHash: string;
  sourcePath?: string;
}) {
  const [lead] = await db
    .insert(schema.leads)
    .values({
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message,
      vehicleId: input.vehicleId ?? null,
      vehicleLabel: input.vehicleLabel ?? null,
      data: input.data ?? {},
      consentAt: new Date(),
      ipHash: input.ipHash,
      sourcePath: input.sourcePath?.slice(0, 200),
    })
    .returning({ id: schema.leads.id });

  const lines = [
    `Tipo: ${LEAD_TYPE_LABELS[input.type]}`,
    `Nome: ${input.name}`,
    `Email: ${input.email}`,
    `Telefone: ${input.phone || "—"}`,
    input.vehicleLabel ? `Viatura: ${input.vehicleLabel}` : "",
    input.data?.preferredDate ? `Data pretendida: ${formatDate(input.data.preferredDate)} às ${input.data.preferredTime}` : "",
    "",
    input.message,
  ].filter((l) => l !== "");
  await notifyTeam(`[Lead] ${LEAD_TYPE_LABELS[input.type]} — ${input.name}`, lines.join("\n"), input.email);
  return lead!.id;
}

async function confirmToCustomer(email: string, subject: string, body: string) {
  await sendEmail({ to: email, subject, text: `${body}\n\nAutoCasteloBranco (demonstração — dados fictícios)` });
}

export async function submitInfoRequest(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const guard = await guardForm(fd, "lead");
  if ("blocked" in guard) return guard.blocked;
  const parsed = infoLeadSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { ok: false, message: "Verifique os campos assinalados.", errors: zodErrors(parsed.error) };
  const d = parsed.data;
  const label = await vehicleLabel(d.vehicleId);
  if (!label) return { ok: false, message: "Esta viatura já não está disponível." };
  await saveLead({ type: "informacao", name: d.name, email: d.email, phone: d.phone, message: d.message, vehicleId: d.vehicleId, vehicleLabel: label, ipHash: guard.ipHash, sourcePath: String(fd.get("path") ?? "") });
  await confirmToCustomer(d.email, `Recebemos o seu pedido sobre ${label}`, `Olá ${d.name},\n\nRecebemos o seu pedido de informação sobre ${label}. Respondemos normalmente em menos de 1 dia útil.`);
  return { ok: true, message: "Pedido enviado. Respondemos em menos de 1 dia útil." };
}

export async function submitTestDrive(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const guard = await guardForm(fd, "lead");
  if ("blocked" in guard) return guard.blocked;
  const parsed = testDriveSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { ok: false, message: "Verifique os campos assinalados.", errors: zodErrors(parsed.error) };
  const d = parsed.data;
  const err = validateTestDrive(d.preferredDate, d.preferredTime, todayLisbon());
  if (err) return { ok: false, message: err, errors: { preferredDate: err } };
  const label = await vehicleLabel(d.vehicleId);
  if (!label) return { ok: false, message: "Esta viatura já não está disponível." };
  await saveLead({
    type: "test_drive",
    name: d.name,
    email: d.email,
    phone: d.phone,
    message: d.message,
    vehicleId: d.vehicleId,
    vehicleLabel: label,
    data: { preferredDate: d.preferredDate, preferredTime: d.preferredTime },
    ipHash: guard.ipHash,
    sourcePath: String(fd.get("path") ?? ""),
  });
  await confirmToCustomer(
    d.email,
    `Pedido de test-drive — ${label}`,
    `Olá ${d.name},\n\nRecebemos o seu pedido de test-drive para ${formatDate(d.preferredDate)} às ${d.preferredTime}. Vamos ligar-lhe para confirmar. Traga a carta de condução.`,
  );
  return { ok: true, message: `Pedido de test-drive para ${formatDate(d.preferredDate)} às ${d.preferredTime} enviado. Vamos ligar-lhe a confirmar.` };
}

export async function submitContact(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const guard = await guardForm(fd, "lead");
  if ("blocked" in guard) return guard.blocked;
  const parsed = contactSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { ok: false, message: "Verifique os campos assinalados.", errors: zodErrors(parsed.error) };
  const d = parsed.data;
  await saveLead({ type: "contacto", name: d.name, email: d.email, phone: d.phone, message: d.message, data: { subject: d.subject }, ipHash: guard.ipHash, sourcePath: "/contactos" });
  await confirmToCustomer(d.email, "Recebemos a sua mensagem", `Olá ${d.name},\n\nObrigado pelo contacto sobre "${d.subject}". Respondemos em breve.`);
  return { ok: true, message: "Mensagem enviada. Obrigado pelo contacto!" };
}
