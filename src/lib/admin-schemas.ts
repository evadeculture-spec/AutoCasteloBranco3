import { z } from "zod";
import { BODY_KEYS, FUEL_KEYS, GEARBOX_KEYS, STATUS_KEYS } from "./labels";

const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(min, "Valor inválido.").max(max, "Valor inválido.").nullable());

const year = new Date().getFullYear();

export const vehicleAdminSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Só letras minúsculas, números e hífenes.")
    .max(90)
    .optional()
    .default(""),
  status: z.enum(STATUS_KEYS as [string, ...string[]]),
  featured: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  brand: z.string().trim().min(2, "Indique a marca.").max(40),
  model: z.string().trim().min(1, "Indique o modelo.").max(60),
  version: z.string().trim().max(100).default(""),
  year: z.coerce.number({ error: "Indique o ano." }).int().min(1980, "Ano inválido.").max(year + 1, "Ano inválido."),
  month: optInt(1, 12),
  km: z.coerce.number({ error: "Indique os km." }).int().min(0).max(2_000_000),
  price: z.coerce.number({ error: "Indique o preço." }).int().min(100, "Preço inválido.").max(2_000_000),
  previousPrice: optInt(100, 2_000_000),
  fuel: z.enum(FUEL_KEYS as [string, ...string[]]),
  gearbox: z.enum(GEARBOX_KEYS as [string, ...string[]]),
  bodyType: z.enum(BODY_KEYS as [string, ...string[]]),
  powerHp: optInt(1, 2000),
  engineCc: optInt(1, 10000),
  batteryKwh: optInt(1, 300),
  rangeKm: optInt(1, 2000),
  doors: optInt(1, 6),
  seats: optInt(1, 9),
  color: z.string().trim().max(60).default(""),
  consumption: z.string().trim().max(60).default(""),
  co2: optInt(0, 1000),
  warrantyMonths: z.coerce.number().int().min(0).max(120),
  owners: optInt(0, 20),
  vatDeductible: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  revised: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  description: z.string().trim().max(5000).default(""),
  history: z
    .string()
    .default("[]")
    .transform((s, ctx) => {
      try {
        const arr = JSON.parse(s) as unknown;
        const parsed = z
          .array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), km: z.number().int().min(0).nullable(), description: z.string().trim().min(1).max(200) }))
          .max(50)
          .safeParse(arr);
        if (!parsed.success) {
          ctx.addIssue({ code: "custom", message: "Histórico inválido: cada entrada precisa de data e descrição." });
          return z.NEVER;
        }
        return parsed.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Histórico inválido." });
        return z.NEVER;
      }
    }),
});

export type VehicleAdminInput = z.infer<typeof vehicleAdminSchema>;
