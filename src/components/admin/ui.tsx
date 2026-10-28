import Link from "next/link";
import { cn } from "@/lib/format";
import { BOOKING_STATUS_LABELS, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, STATUS_LABELS, type BookingStatusKey, type LeadStatusKey, type LeadTypeKey, type StatusKey } from "@/lib/labels";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const vehicleTone: Record<StatusKey, string> = { rascunho: "badge-neutral", disponivel: "badge-ok", reservado: "badge-warn", vendido: "badge-dark" };
export function VehicleStatusBadge({ s }: { s: StatusKey }) {
  return <span className={cn("badge", vehicleTone[s])}>{STATUS_LABELS[s]}</span>;
}

const leadTone: Record<LeadStatusKey, string> = { nova: "badge-signal", em_contacto: "badge-warn", visita_marcada: "badge-neutral", ganha: "badge-ok", perdida: "badge-dark" };
export function LeadStatusBadge({ s }: { s: LeadStatusKey }) {
  return <span className={cn("badge", leadTone[s])}>{LEAD_STATUS_LABELS[s]}</span>;
}
export function LeadTypeBadge({ t }: { t: LeadTypeKey }) {
  return <span className="badge badge-neutral">{LEAD_TYPE_LABELS[t]}</span>;
}

const bookingTone: Record<BookingStatusKey, string> = { pendente: "badge-signal", confirmada: "badge-ok", concluida: "badge-neutral", cancelada: "badge-dark", falta: "badge-danger" };
export function BookingStatusBadge({ s }: { s: BookingStatusKey }) {
  return <span className={cn("badge", bookingTone[s])}>{BOOKING_STATUS_LABELS[s]}</span>;
}

export function FilterTabs({ items, current }: { items: { href: string; label: string; value: string; count?: number }[]; current: string }) {
  return (
    <nav aria-label="Filtro" className="mb-4 flex gap-1 overflow-x-auto">
      {items.map((i) => (
        <Link
          key={i.value}
          href={i.href}
          aria-current={i.value === current ? "page" : undefined}
          className={cn("inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium", i.value === current ? "border-ink bg-ink text-white" : "border-line-strong bg-surface hover:border-ink")}
        >
          {i.label}
          {i.count != null && <span className="num text-xs opacity-70">{i.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="p-8 text-center text-sm text-muted">{children}</td>
    </tr>
  );
}
