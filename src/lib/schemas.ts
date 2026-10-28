import { z } from "zod";
import { FUEL_KEYS, GEARBOX_KEYS } from "./labels";

const name = z.string().trim().min(2, "Indique o seu nome.").max(80, "Nome demasiado longo.");
const email = z.string().trim().toLowerCase().pipe(z.email("Indique um email válido.")).pipe(z.string().max(120));
const phone = z
  .string()
  .trim()
  .regex(/^(\+?\d[\d\s]{8,16})$/, "Indique um telefone válido (ex.: 912 345 678).");
const optionalPhone = z.union([z.literal(""), phone]).optional().default("");
const consent = z.literal("on", { error: "É necessário aceitar a Política de Privacidade." });
const message = z.string().trim().max(2000, "Mensagem demasiado longa (máx. 2000 caracteres).");

export const baseLeadFields = { name, email, consent, website: z.string().max(0).optional(), ts: z.string().optional() };

export const infoLeadSchema = z.object({
  ...baseLeadFields,
  phone: optionalPhone,
  message: message.min(5, "Escreva uma mensagem (mín. 5 caracteres)."),
  vehicleId: z.uuid(),
});

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data.");
const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Escolha uma hora.");

export const testDriveSchema = z.object({
  ...baseLeadFields,
  phone,
  message: message.optional().default(""),
  vehicleId: z.uuid(),
  preferredDate: isoDay,
  preferredTime: hhmm,
});

export const contactSchema = z.object({
  ...baseLeadFields,
  phone: optionalPhone,
  subject: z.string().trim().min(2, "Escolha ou escreva um assunto.").max(120),
  message: message.min(5, "Escreva uma mensagem (mín. 5 caracteres)."),
});

const year = new Date().getFullYear();
export const tradeInVehicleSchema = z.object({
  brand: z.string().trim().min(2, "Indique a marca.").max(40),
  model: z.string().trim().min(1, "Indique o modelo.").max(60),
  version: z.string().trim().max(80).optional().default(""),
  year: z.coerce.number({ error: "Indique o ano." }).int().min(1990, "Ano inválido.").max(year + 1, "Ano inválido."),
  km: z.coerce.number({ error: "Indique os quilómetros." }).int().min(0, "Valor inválido.").max(1_500_000, "Valor inválido."),
  fuel: z.enum(FUEL_KEYS as [string, ...string[]], { error: "Escolha o combustível." }),
  gearbox: z.enum(GEARBOX_KEYS as [string, ...string[]], { error: "Escolha a caixa." }),
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^$|^[A-Z0-9]{2}-?[A-Z0-9]{2}-?[A-Z0-9]{2}$/, "Matrícula no formato AA-00-AA.")
    .optional()
    .default(""),
});

export const tradeInStateSchema = z.object({
  condition: z.enum(["excelente", "bom", "razoavel", "precisa_reparacao"], { error: "Escolha o estado geral." }),
  accidents: z.enum(["nao", "sim_pequeno", "sim_grave"], { error: "Indique se teve acidentes." }),
  serviceBook: z.enum(["completo", "parcial", "nao"], { error: "Indique o histórico de revisões." }),
  notes: z.string().trim().max(1500).optional().default(""),
});

export const tradeInContactSchema = z.object({
  ...baseLeadFields,
  phone,
  interestVehicle: z.string().trim().max(120).optional().default(""),
});

export const tradeInSchema = tradeInVehicleSchema.extend(tradeInStateSchema.shape).extend(tradeInContactSchema.shape);

export const bookingSchema = z.object({
  ...baseLeadFields,
  phone,
  serviceId: z.uuid({ error: "Escolha um serviço." }),
  day: isoDay,
  time: hhmm,
  vehicleInfo: z.string().trim().min(2, "Indique marca e modelo da viatura.").max(120),
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^$|^[A-Z0-9]{2}-?[A-Z0-9]{2}-?[A-Z0-9]{2}$/, "Matrícula no formato AA-00-AA.")
    .optional()
    .default(""),
  notes: message.optional().default(""),
});

export const CONDITION_LABELS = { excelente: "Excelente", bom: "Bom", razoavel: "Razoável", precisa_reparacao: "Precisa de reparação" } as const;
export const ACCIDENT_LABELS = { nao: "Nunca teve acidentes", sim_pequeno: "Sim, pequeno toque", sim_grave: "Sim, acidente com reparação" } as const;
export const SERVICEBOOK_LABELS = { completo: "Livro de revisões completo", parcial: "Revisões parciais", nao: "Sem histórico" } as const;

export type FieldErrors = Record<string, string>;
export type ActionResult = { ok: boolean; message: string; errors?: FieldErrors; ref?: string } | null;

export function zodErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formDataToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}
