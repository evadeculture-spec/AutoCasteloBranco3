import Link from "next/link";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { BookingStatusBadge, LeadStatusBadge, LeadTypeBadge, PageHeader } from "@/components/admin/ui";
import { addDaysIso, formatDateTime, formatDayShort, formatNumber, todayLisbon, weekdayOfIso } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const startOfTodayLisbon = sql`(date_trunc('day', now() AT TIME ZONE 'Europe/Lisbon') AT TIME ZONE 'Europe/Lisbon')`;

export default async function Dashboard() {
  const today = todayLisbon();
  const wd = weekdayOfIso(today);
  const weekStart = addDaysIso(today, -((wd + 6) % 7));
  const weekEnd = addDaysIso(weekStart, 6);
  const since30 = addDaysIso(today, -30);

  const [[active], [leadsToday], [leads7], [bookingsWeek], topViewed, recentLeads, upcoming] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(schema.vehicles).where(inArray(schema.vehicles.status, ["disponivel", "reservado"])),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.leads).where(gte(schema.leads.createdAt, startOfTodayLisbon)),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.leads).where(gte(schema.leads.createdAt, sql`${startOfTodayLisbon} - interval '6 days'`)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.workshopBookings)
      .where(and(gte(schema.workshopBookings.day, weekStart), lte(schema.workshopBookings.day, weekEnd), inArray(schema.workshopBookings.status, ["pendente", "confirmada", "concluida"]))),
    db
      .select({
        id: schema.vehicles.id,
        brand: schema.vehicles.brand,
        model: schema.vehicles.model,
        slug: schema.vehicles.slug,
        total: schema.vehicles.viewsCount,
        last30: sql<number>`(SELECT count(*)::int FROM vehicle_views vv WHERE vv.vehicle_id = "vehicles"."id" AND vv.day >= ${since30})`,
      })
      .from(schema.vehicles)
      .where(inArray(schema.vehicles.status, ["disponivel", "reservado"]))
      .orderBy(desc(sql`(SELECT count(*) FROM vehicle_views vv WHERE vv.vehicle_id = "vehicles"."id" AND vv.day >= ${since30})`))
      .limit(6),
    db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(6),
    db
      .select()
      .from(schema.workshopBookings)
      .where(and(gte(schema.workshopBookings.day, today), inArray(schema.workshopBookings.status, ["pendente", "confirmada"])))
      .orderBy(schema.workshopBookings.day, schema.workshopBookings.time)
      .limit(6),
  ]);
  const maxViews = Math.max(1, ...topViewed.map((t) => t.last30));
  const [newCount] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.leads).where(eq(schema.leads.status, "nova"));

  const kpis = [
    { label: "Viaturas ativas", value: active?.n ?? 0, href: "/admin/viaturas" },
    { label: "Leads hoje", value: leadsToday?.n ?? 0, href: "/admin/leads" },
    { label: "Leads 7 dias", value: leads7?.n ?? 0, href: "/admin/leads", sub: `${newCount?.n ?? 0} por tratar` },
    { label: "Marcações esta semana", value: bookingsWeek?.n ?? 0, href: "/admin/oficina" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Semana de ${formatDayShort(weekStart)} a ${formatDayShort(weekEnd)}`} actions={<Link href="/admin/viaturas/nova" className="btn btn-primary">Nova viatura</Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="card p-5 transition-colors duration-150 hover:border-ink">
            <p className="spec-label">{k.label}</p>
            <p className="num mt-2 text-4xl font-semibold tracking-tight">{formatNumber(k.value)}</p>
            {k.sub && <p className="mt-1 text-xs text-signal-ink">{k.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-5" aria-labelledby="top-t">
          <h2 id="top-t" className="text-lg">Viaturas mais vistas <span className="text-sm font-normal text-muted">· últimos 30 dias</span></h2>
          <ol className="mt-4 space-y-3">
            {topViewed.map((t, i) => (
              <li key={t.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={`/admin/viaturas/${t.id}`} className="truncate font-medium hover:underline"><span className="num mr-2 text-muted">{i + 1}.</span>{t.brand} {t.model}</Link>
                  <span className="num shrink-0 text-muted"><strong className="text-ink">{t.last30}</strong> · {formatNumber(t.total)} total</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                  <div className="h-full rounded-full bg-signal" style={{ width: `${(t.last30 / maxViews) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="card p-5" aria-labelledby="leads-t">
          <div className="flex items-center justify-between">
            <h2 id="leads-t" className="text-lg">Leads recentes</h2>
            <Link href="/admin/leads" className="link text-sm">Ver todas</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {recentLeads.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-bg">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{l.name}</span>
                    <span className="block truncate text-xs text-muted">{l.vehicleLabel ?? l.message.slice(0, 60)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <LeadTypeBadge t={l.type} />
                    <LeadStatusBadge s={l.status} />
                    <span className="num text-xs text-muted">{formatDateTime(l.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
            {!recentLeads.length && <li className="py-6 text-center text-sm text-muted">Sem leads.</li>}
          </ul>
        </section>

        <section className="card p-5 xl:col-span-2" aria-labelledby="book-t">
          <div className="flex items-center justify-between">
            <h2 id="book-t" className="text-lg">Próximas marcações</h2>
            <Link href="/admin/oficina" className="link text-sm">Calendário</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="num w-32 font-medium">{formatDayShort(b.day)} · {b.time}</span>
                <span className="min-w-0 flex-1 truncate">{b.serviceName} — {b.name} <span className="text-muted">({b.vehicleInfo})</span></span>
                <BookingStatusBadge s={b.status} />
              </li>
            ))}
            {!upcoming.length && <li className="py-6 text-center text-sm text-muted">Sem marcações futuras.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
