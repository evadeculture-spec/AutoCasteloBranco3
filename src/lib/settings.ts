import "server-only";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";
import { DEFAULT_SETTINGS, siteSettingsSchema, type SiteSettings } from "./settings-schema";

export const SETTINGS_TAG = "settings";

async function loadSettings(): Promise<SiteSettings> {
  try {
    const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "site"));
    if (!row) return DEFAULT_SETTINGS;
    const parsed = siteSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...(row.value as object) });
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch (err) {
    console.error("[settings] falha a ler definições, a usar valores por omissão", err);
    return DEFAULT_SETTINGS;
  }
}

export const getSettings = unstable_cache(loadSettings, ["site-settings"], {
  tags: [SETTINGS_TAG],
  revalidate: 3600,
});
