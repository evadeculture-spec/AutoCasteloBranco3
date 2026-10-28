"use server";

import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateSettings } from "@/lib/revalidate";
import { formDataToObject, zodErrors, type ActionResult } from "@/lib/schemas";
import { siteSettingsSchema } from "@/lib/settings-schema";

export async function saveSettings(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const raw = formDataToObject(fd);
  const num = (k: string) => Number(String(raw[k] ?? "").replace(",", "."));
  const parsed = siteSettingsSchema.safeParse({
    ...raw,
    whatsapp: String(raw.whatsapp ?? "").replace(/\D/g, ""),
    latitude: num("latitude"),
    longitude: num("longitude"),
    financingTan: num("financingTan"),
    financingTaeg: num("financingTaeg"),
    financingMaxMonths: num("financingMaxMonths"),
  });
  if (!parsed.success) return { ok: false, message: "Verifique os campos assinalados.", errors: zodErrors(parsed.error) };
  await db.insert(schema.settings).values({ key: "site", value: parsed.data }).onConflictDoUpdate({ target: schema.settings.key, set: { value: parsed.data } });
  revalidateSettings();
  return { ok: true, message: "Definições guardadas e publicadas no site." };
}
