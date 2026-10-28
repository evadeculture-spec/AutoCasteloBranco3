import "server-only";
import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { schema } from "@/db";
import { LEAD_STATUS_KEYS, LEAD_TYPE_KEYS, type LeadStatusKey, type LeadTypeKey } from "./labels";

export function leadFilters(sp: { tipo?: string; estado?: string; q?: string }) {
  const tipo = LEAD_TYPE_KEYS.includes(sp.tipo as LeadTypeKey) ? (sp.tipo as LeadTypeKey) : undefined;
  const estado = LEAD_STATUS_KEYS.includes(sp.estado as LeadStatusKey) ? (sp.estado as LeadStatusKey) : undefined;
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const conds: SQL[] = [];
  if (tipo) conds.push(eq(schema.leads.type, tipo));
  if (estado) conds.push(eq(schema.leads.status, estado));
  if (q) conds.push(or(ilike(schema.leads.name, `%${q}%`), ilike(schema.leads.email, `%${q}%`), ilike(schema.leads.phone, `%${q}%`), ilike(schema.leads.vehicleLabel, `%${q}%`))!);
  return { tipo, estado, q, where: conds.length ? and(...conds) : undefined };
}
