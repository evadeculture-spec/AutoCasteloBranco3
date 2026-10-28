import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { Download } from "lucide-react";
import { db, schema } from "@/db";
import { EmptyRow, FilterTabs, LeadTypeBadge, PageHeader } from "@/components/admin/ui";
import { LeadStatusSelect } from "@/components/admin/lead-controls";
import { formatDateTime, formatNumber } from "@/lib/format";
import { LEAD_STATUS_KEYS, LEAD_STATUS_LABELS, LEAD_TYPE_KEYS, LEAD_TYPE_LABELS } from "@/lib/labels";
import { leadFilters } from "@/lib/lead-query";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ tipo?: string; estado?: string; q?: string }> }) {
  const sp = await searchParams;
  const { tipo, estado, q, where } = leadFilters(sp);
  const [rows, byType, byStatus] = await Promise.all([
    db.select().from(schema.leads).where(where).orderBy(desc(schema.leads.createdAt)).limit(300),
    db.select({ k: schema.leads.type, n: sql<number>`count(*)::int` }).from(schema.leads).groupBy(schema.leads.type),
    db.select({ k: schema.leads.status, n: sql<number>`count(*)::int` }).from(schema.leads).groupBy(schema.leads.status),
  ]);
  const total = byType.reduce((a, r) => a + r.n, 0);
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { tipo, estado, q, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/admin/leads?${s}` : "/admin/leads";
  };
  const exportQs = new URLSearchParams(Object.entries({ tipo, estado, q }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${formatNumber(total)} no total · informação, test-drive, retoma e contacto`}
        actions={<a href={`/api/admin/leads/export${exportQs ? `?${exportQs}` : ""}`} className="btn btn-secondary"><Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV</a>}
      />
      <FilterTabs current={tipo ?? "todos"} items={[{ value: "todos", label: "Todos os tipos", href: href({ tipo: undefined }), count: total }, ...LEAD_TYPE_KEYS.map((t) => ({ value: t, label: LEAD_TYPE_LABELS[t], href: href({ tipo: t }), count: byType.find((r) => r.k === t)?.n ?? 0 }))]} />
      <FilterTabs current={estado ?? "todos"} items={[{ value: "todos", label: "Todos os estados", href: href({ estado: undefined }) }, ...LEAD_STATUS_KEYS.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s], href: href({ estado: s }), count: byStatus.find((r) => r.k === s)?.n ?? 0 }))]} />
      <form className="mb-4 flex gap-2" role="search">
        {tipo && <input type="hidden" name="tipo" value={tipo} />}
        {estado && <input type="hidden" name="estado" value={estado} />}
        <label htmlFor="q" className="sr-only">Pesquisar leads</label>
        <input id="q" name="q" defaultValue={q} placeholder="Nome, email, telefone ou viatura…" className="input max-w-sm" />
        <button className="btn btn-secondary" type="submit">Pesquisar</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-line text-left">
            <tr className="[&>th]:p-3 [&>th]:font-medium [&>th]:text-muted">
              <th scope="col">Recebida</th>
              <th scope="col">Contacto</th>
              <th scope="col">Tipo</th>
              <th scope="col">Assunto / viatura</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((l) => (
              <tr key={l.id} className={l.status === "nova" ? "bg-signal-soft/40 hover:bg-bg" : "hover:bg-bg"}>
                <td className="num whitespace-nowrap p-3 text-xs">{formatDateTime(l.createdAt)}</td>
                <td className="p-3">
                  <Link href={`/admin/leads/${l.id}`} className="font-medium hover:underline">{l.name}</Link>
                  <p className="text-xs text-muted">{l.phone || l.email}</p>
                </td>
                <td className="p-3"><LeadTypeBadge t={l.type} /></td>
                <td className="max-w-xs p-3">
                  <p className="truncate">
                    {l.type === "retoma" && l.data.tradeIn ? `Retoma: ${l.data.tradeIn.brand} ${l.data.tradeIn.model} ${l.data.tradeIn.year}` : (l.vehicleLabel ?? l.data.subject ?? "—")}
                  </p>
                  {l.data.preferredDate && <p className="num text-xs text-muted">Pretende {l.data.preferredDate.split("-").reverse().join("/")} às {l.data.preferredTime}</p>}
                </td>
                <td className="p-3">
                  <LeadStatusSelect id={l.id} status={l.status} label={l.name} />
                </td>
              </tr>
            ))}
            {!rows.length && <EmptyRow cols={5}>Sem leads com estes filtros.</EmptyRow>}
          </tbody>
        </table>
      </div>
    </>
  );
}
