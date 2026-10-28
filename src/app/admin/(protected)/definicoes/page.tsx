import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { emailEnabled } from "@/lib/email";
import { DEFAULT_SETTINGS, siteSettingsSchema } from "@/lib/settings-schema";

export const metadata = { title: "Definições" };

export default async function SettingsPage() {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "site"));
  const parsed = siteSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...((row?.value as object) ?? {}) });
  const settings = parsed.success ? parsed.data : DEFAULT_SETTINGS;
  return (
    <>
      <PageHeader title="Definições" subtitle={`Notificações por email: ${emailEnabled() ? "ativas (Resend)" : "inativas — defina RESEND_API_KEY para ativar; os pedidos ficam sempre gravados na base de dados"}.`} />
      <SettingsForm settings={settings} />
    </>
  );
}
