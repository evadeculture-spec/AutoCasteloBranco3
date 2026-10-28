"use server";

import { randomUUID } from "node:crypto";
import { db, schema } from "@/db";
import { notifyTeam, sendEmail } from "@/lib/email";
import { guardForm } from "@/lib/form-guard";
import { formatKm } from "@/lib/format";
import { formDataToObject, tradeInSchema, zodErrors, type ActionResult } from "@/lib/schemas";
import { extFor, MAX_IMAGE_BYTES, putFile, sniffImageType } from "@/lib/storage";

const MAX_PHOTOS = 6;

export async function submitTradeIn(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const guard = await guardForm(fd, "retoma", 4, 900);
  if ("blocked" in guard) return guard.blocked;
  const parsed = tradeInSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { ok: false, message: "Verifique os campos assinalados.", errors: zodErrors(parsed.error) };
  const d = parsed.data;

  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) return { ok: false, message: `Envie no máximo ${MAX_PHOTOS} fotografias.` };
  const photos: { key: string; url: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: "Cada fotografia deve ter no máximo 5 MB." };
    const buf = await file.arrayBuffer();
    const type = sniffImageType(buf);
    if (!type) return { ok: false, message: "Só aceitamos fotografias JPG, PNG, WebP ou AVIF." };
    const key = `leads/retoma/${randomUUID()}.${extFor(type)}`;
    await putFile(key, buf, type);
    photos.push({ key, url: `/api/media/${key}` });
  }

  const label = `${d.brand} ${d.model} ${d.version}`.trim();
  const message = [
    `Retoma: ${label}, ${d.year}, ${formatKm(d.km)}`,
    d.interestVehicle ? `Interesse em: ${d.interestVehicle}` : "",
    d.notes,
  ]
    .filter(Boolean)
    .join("\n");

  await db.insert(schema.leads).values({
    type: "retoma",
    name: d.name,
    email: d.email,
    phone: d.phone,
    message,
    vehicleLabel: d.interestVehicle || null,
    data: {
      tradeIn: {
        brand: d.brand,
        model: d.model,
        version: d.version,
        year: d.year,
        km: d.km,
        fuel: d.fuel,
        gearbox: d.gearbox,
        plate: d.plate,
        condition: d.condition,
        accidents: d.accidents,
        serviceBook: d.serviceBook,
        notes: d.notes,
        photos,
      },
    },
    consentAt: new Date(),
    ipHash: guard.ipHash,
    sourcePath: "/retoma",
  });

  await notifyTeam(`[Lead] Retoma — ${label} (${d.name})`, `${message}\n\nContacto: ${d.name} · ${d.phone} · ${d.email}\nFotografias: ${photos.length}`, d.email);
  await sendEmail({
    to: d.email,
    subject: "Recebemos o seu pedido de avaliação de retoma",
    text: `Olá ${d.name},\n\nRecebemos os dados do seu ${label}. Vamos analisar e enviar-lhe uma proposta de valor em até 2 dias úteis.\n\nAutoCasteloBranco (demonstração)`,
  });
  return { ok: true, message: "Pedido de avaliação enviado! Enviamos uma proposta em até 2 dias úteis." };
}
