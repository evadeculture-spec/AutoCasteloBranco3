import { asc, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/admin/ui";
import { BlockedDayForm, RemoveBlockedDay, SlotsConfigForm } from "@/components/admin/workshop-controls";
import { formatDate, todayLisbon } from "@/lib/format";

export const metadata = { title: "Horário e vagas" };

export default async function SchedulePage() {
  const today = todayLisbon();
  const [configs, blocked] = await Promise.all([
    db.select().from(schema.workshopSlotsConfig),
    db.select().from(schema.blockedDays).where(gte(schema.blockedDays.day, today)).orderBy(asc(schema.blockedDays.day)),
  ]);
  return (
    <>
      <PageHeader title="Horário e vagas" subtitle="Define os slots disponíveis para marcação online. Vagas/slot = viaturas atendidas em simultâneo." />
      <section className="card mb-6 p-5" aria-labelledby="h-t">
        <h2 id="h-t" className="mb-3 text-lg">Horário semanal</h2>
        <SlotsConfigForm configs={configs} />
      </section>
      <section className="card p-5" aria-labelledby="b-t">
        <h2 id="b-t" className="mb-3 text-lg">Dias bloqueados</h2>
        <BlockedDayForm min={today} />
        <ul className="mt-5 divide-y divide-line">
          {blocked.map((b) => (
            <li key={b.day} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span><strong className="num">{formatDate(b.day)}</strong> {b.reason && <span className="text-muted">— {b.reason}</span>}</span>
              <RemoveBlockedDay day={b.day} label={formatDate(b.day)} />
            </li>
          ))}
          {!blocked.length && <li className="py-3 text-sm text-muted">Nenhum dia bloqueado.</li>}
        </ul>
      </section>
    </>
  );
}
