import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS } from "@/lib/labels";
import { leadFilters } from "@/lib/lead-query";

function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Evita injeção de fórmulas no Excel
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await getCurrentUser())) return new Response("Não autenticado", { status: 401 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const { where } = leadFilters(sp);
  const rows = await db.select().from(schema.leads).where(where).orderBy(desc(schema.leads.createdAt));
  const header = ["Data", "Tipo", "Estado", "Nome", "Email", "Telefone", "Viatura", "Data pretendida", "Hora", "Retoma", "Mensagem"];
  const lines = rows.map((l) => {
    const t = l.data.tradeIn;
    return [
      formatDateTime(l.createdAt),
      LEAD_TYPE_LABELS[l.type],
      LEAD_STATUS_LABELS[l.status],
      l.name,
      l.email,
      l.phone,
      l.vehicleLabel ?? "",
      l.data.preferredDate ?? "",
      l.data.preferredTime ?? "",
      t ? `${t.brand} ${t.model} ${t.year} ${t.km} km` : "",
      l.message,
    ]
      .map(cell)
      .join(";");
  });
  // BOM + ";" para abrir corretamente no Excel em PT
  const csv = "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
