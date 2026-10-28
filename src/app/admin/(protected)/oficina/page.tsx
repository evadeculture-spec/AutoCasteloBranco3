import Link from "next/link";
import { and, asc, gte, lte } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db, schema } from "@/db";
import { BookingNotes, BookingStatusSelect } from "@/components/admin/workshop-controls";
import { EmptyRow, PageHeader } from "@/components/admin/ui";
import { addDaysIso, cn, formatDate, formatDayShort, todayLisbon, weekdayOfIso } from "@/lib/format";
import { slotTimesFor } from "@/lib/workshop";

export const metadata = { title: "Marcações da oficina" };

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const sp = await searchParams;
  const today = todayLisbon();
  const base = sp.semana && /^\d{4}-\d{2}-\d{2}$/.test(sp.semana) ? sp.semana : today;
  const monday = addDaysIso(base, -((weekdayOfIso(base) + 6) % 7));
  const sunday = addDaysIso(monday, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDaysIso(monday, i));

  const [bookings, configs, blocked] = await Promise.all([
    db.select().from(schema.workshopBookings).where(and(gte(schema.workshopBookings.day, monday), lte(schema.workshopBookings.day, sunday))).orderBy(asc(schema.workshopBookings.day), asc(schema.workshopBookings.time)),
    db.select().from(schema.workshopSlotsConfig),
    db.select().from(schema.blockedDays).where(and(gte(schema.blockedDays.day, monday), lte(schema.blockedDays.day, sunday))),
  ]);
  const allTimes = [...new Set(days.flatMap((d) => slotTimesFor(configs.find((c) => c.weekday === weekdayOfIso(d)))))].sort();
  const active = bookings.filter((b) => b.status === "pendente" || b.status === "confirmada");

  return (
    <>
      <PageHeader
        title="Marcações da oficina"
        subtitle={`Semana de ${formatDate(monday)} a ${formatDate(sunday)} · ${active.length} ativas`}
        actions={
          <>
            <Link href={`/admin/oficina?semana=${addDaysIso(monday, -7)}`} className="btn btn-secondary btn-icon" aria-label="Semana anterior"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href="/admin/oficina" className="btn btn-secondary">Esta semana</Link>
            <Link href={`/admin/oficina?semana=${addDaysIso(monday, 7)}`} className="btn btn-secondary btn-icon" aria-label="Semana seguinte"><ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
          </>
        }
      />

      <section className="card mb-6 overflow-x-auto" aria-label="Calendário semanal">
        <table className="w-full min-w-[900px] table-fixed text-xs">
          <thead>
            <tr>
              <th scope="col" className="w-16 border-b border-line p-2"><span className="sr-only">Hora</span></th>
              {days.map((d) => {
                const isBlocked = blocked.find((b) => b.day === d);
                const cfg = configs.find((c) => c.weekday === weekdayOfIso(d));
                return (
                  <th key={d} scope="col" className={cn("border-b border-l border-line p-2 text-left font-medium", d === today && "bg-signal-soft")}>
                    <span className="num">{formatDayShort(d)}</span>
                    {isBlocked ? <span className="badge badge-dark ml-1">Bloqueado</span> : !cfg?.isOpen ? <span className="ml-1 text-muted">fechado</span> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {allTimes.map((t) => (
              <tr key={t}>
                <th scope="row" className="num border-b border-line p-2 text-left font-normal text-muted">{t}</th>
                {days.map((d) => {
                  const cfg = configs.find((c) => c.weekday === weekdayOfIso(d));
                  const valid = slotTimesFor(cfg).includes(t) && !blocked.some((b) => b.day === d);
                  const here = bookings.filter((b) => b.day === d && b.time === t && b.status !== "cancelada");
                  const used = here.filter((b) => b.status === "pendente" || b.status === "confirmada").length;
                  return (
                    <td key={d} className={cn("h-14 border-b border-l border-line p-1 align-top", !valid && "bg-[repeating-linear-gradient(45deg,#f1efea,#f1efea_6px,#f8f7f4_6px,#f8f7f4_12px)]")}>
                      {here.map((b) => (
                        <a key={b.id} href={`#b-${b.id}`} className={cn("mb-1 block truncate rounded-md px-1.5 py-1 font-medium", b.status === "confirmada" ? "bg-ok-soft text-ok" : b.status === "pendente" ? "bg-signal-soft text-signal-ink" : "bg-subtle text-muted")}>
                          {b.name.replace(/^Exemplo — /, "")} · {b.serviceName}
                        </a>
                      ))}
                      {valid && <span className="num text-[10px] text-muted">{used}/{cfg?.capacity}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!allTimes.length && <EmptyRow cols={8}>Sem horário configurado.</EmptyRow>}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto" aria-labelledby="lista-t">
        <h2 id="lista-t" className="p-4 text-lg">Lista da semana</h2>
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-y border-line text-left">
            <tr className="[&>th]:p-3 [&>th]:font-medium [&>th]:text-muted">
              <th scope="col">Dia · hora</th><th scope="col">Cliente</th><th scope="col">Serviço · viatura</th><th scope="col">Estado</th><th scope="col">Notas internas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookings.map((b) => (
              <tr key={b.id} id={`b-${b.id}`} className="scroll-mt-6 target:bg-signal-soft">
                <td className="num whitespace-nowrap p-3">{formatDayShort(b.day)} · {b.time}<p className="text-xs text-muted">{b.reference}</p></td>
                <td className="p-3"><p className="font-medium">{b.name}</p><p className="text-xs text-muted">{b.phone} · {b.email}</p></td>
                <td className="p-3"><p>{b.serviceName}</p><p className="text-xs text-muted">{b.vehicleInfo} {b.plate}{b.notes ? ` — “${b.notes}”` : ""}</p></td>
                <td className="p-3"><BookingStatusSelect id={b.id} status={b.status} label={b.name} /></td>
                <td className="p-3"><BookingNotes id={b.id} value={b.internalNotes} /></td>
              </tr>
            ))}
            {!bookings.length && <EmptyRow cols={5}>Sem marcações nesta semana.</EmptyRow>}
          </tbody>
        </table>
      </section>
    </>
  );
}
