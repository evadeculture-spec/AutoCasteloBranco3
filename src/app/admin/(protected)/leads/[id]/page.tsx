import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { db, schema } from "@/db";
import { DeleteNoteButton, LeadPipeline, NoteForm } from "@/components/admin/lead-controls";
import { LeadTypeBadge, PageHeader } from "@/components/admin/ui";
import { formatDate, formatDateTime, formatKm } from "@/lib/format";
import { FUEL_LABELS, GEARBOX_LABELS, type FuelKey, type GearboxKey } from "@/lib/labels";
import { ACCIDENT_LABELS, CONDITION_LABELS, SERVICEBOOK_LABELS } from "@/lib/schemas";
import { telHref, whatsappHref } from "@/lib/site";

export const metadata = { title: "Lead" };

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id));
  if (!lead) notFound();
  const [notes, vehicle] = await Promise.all([
    db
      .select({ id: schema.leadNotes.id, body: schema.leadNotes.body, createdAt: schema.leadNotes.createdAt, author: schema.users.name })
      .from(schema.leadNotes)
      .leftJoin(schema.users, eq(schema.users.id, schema.leadNotes.userId))
      .where(eq(schema.leadNotes.leadId, id))
      .orderBy(desc(schema.leadNotes.createdAt)),
    lead.vehicleId ? db.select({ id: schema.vehicles.id, slug: schema.vehicles.slug, status: schema.vehicles.status }).from(schema.vehicles).where(eq(schema.vehicles.id, lead.vehicleId)).then((r) => r[0]) : Promise.resolve(undefined),
  ]);
  const t = lead.data.tradeIn;
  const phoneDigits = lead.phone.replace(/\D/g, "");

  return (
    <>
      <Link href="/admin/leads" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Leads</Link>
      <PageHeader title={lead.name} subtitle={`Recebida a ${formatDateTime(lead.createdAt)}${lead.sourcePath ? ` · ${lead.sourcePath}` : ""}`} actions={<LeadTypeBadge t={lead.type} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5" aria-labelledby="pipe-t">
            <h2 id="pipe-t" className="mb-3 text-lg">Estado</h2>
            <LeadPipeline id={lead.id} status={lead.status} />
          </section>

          <section className="card p-5" aria-labelledby="pedido-t">
            <h2 id="pedido-t" className="mb-3 text-lg">Pedido</h2>
            <dl className="grid gap-x-8 md:grid-cols-2">
              {lead.vehicleLabel && (
                <div className="spec-row"><dt className="text-sm text-muted">Viatura</dt><dd className="text-right text-sm font-medium">{vehicle ? <Link className="link" href={`/admin/viaturas/${vehicle.id}`}>{lead.vehicleLabel}</Link> : lead.vehicleLabel}</dd></div>
              )}
              {lead.data.subject && <div className="spec-row"><dt className="text-sm text-muted">Assunto</dt><dd className="text-sm font-medium">{lead.data.subject}</dd></div>}
              {lead.data.preferredDate && (
                <div className="spec-row"><dt className="text-sm text-muted">Test-drive pretendido</dt><dd className="num text-sm font-medium">{formatDate(lead.data.preferredDate)} · {lead.data.preferredTime}</dd></div>
              )}
              <div className="spec-row"><dt className="text-sm text-muted">Consentimento RGPD</dt><dd className="num text-sm">{formatDateTime(lead.consentAt)}</dd></div>
            </dl>
            {lead.message && <p className="mt-4 whitespace-pre-line rounded-xl bg-bg p-4 text-[15px] leading-relaxed">{lead.message}</p>}
          </section>

          {t && (
            <section className="card p-5" aria-labelledby="retoma-t">
              <h2 id="retoma-t" className="mb-3 text-lg">Viatura para retoma</h2>
              <dl className="grid gap-x-8 md:grid-cols-2">
                {[
                  ["Viatura", `${t.brand} ${t.model} ${t.version ?? ""}`],
                  ["Ano", String(t.year)],
                  ["Quilómetros", formatKm(t.km)],
                  ["Combustível", FUEL_LABELS[t.fuel as FuelKey] ?? t.fuel],
                  ["Caixa", GEARBOX_LABELS[t.gearbox as GearboxKey] ?? t.gearbox],
                  ["Matrícula", t.plate || "—"],
                  ["Estado", CONDITION_LABELS[t.condition as keyof typeof CONDITION_LABELS] ?? t.condition],
                  ["Acidentes", ACCIDENT_LABELS[t.accidents as keyof typeof ACCIDENT_LABELS] ?? t.accidents],
                  ["Revisões", SERVICEBOOK_LABELS[t.serviceBook as keyof typeof SERVICEBOOK_LABELS] ?? t.serviceBook],
                ].map(([k, v]) => (
                  <div key={k} className="spec-row"><dt className="text-sm text-muted">{k}</dt><dd className="num text-right text-sm font-medium">{v}</dd></div>
                ))}
              </dl>
              {t.notes && <p className="mt-3 whitespace-pre-line text-sm text-ink-2">{t.notes}</p>}
              {t.photos.length > 0 && (
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {t.photos.map((p, i) => (
                    <li key={p.key}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-line">
                        {/* Imagens privadas: servidas só a administradores, sem otimizador */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={`Fotografia ${i + 1} da viatura para retoma`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="card p-5" aria-labelledby="notas-t">
            <h2 id="notas-t" className="mb-3 text-lg">Notas internas</h2>
            <NoteForm leadId={lead.id} />
            <ul className="mt-5 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="flex gap-3 rounded-xl border border-line p-3">
                  <div className="min-w-0 flex-1">
                    <p className="num text-xs text-muted">{formatDateTime(n.createdAt)} · {n.author ?? "—"}</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{n.body}</p>
                  </div>
                  <DeleteNoteButton noteId={n.id} leadId={lead.id} />
                </li>
              ))}
              {!notes.length && <li className="text-sm text-muted">Ainda sem notas.</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-3">
          <div className="card p-5">
            <h2 className="spec-label mb-3">Contactar</h2>
            <div className="grid gap-2">
              {lead.phone && <a href={telHref(lead.phone)} className="btn btn-dark"><Phone className="h-4 w-4" aria-hidden="true" /> <span className="num">{lead.phone}</span></a>}
              {phoneDigits && <a href={whatsappHref(phoneDigits.length === 9 ? `351${phoneDigits}` : phoneDigits, `Olá ${lead.name.split(" ")[0]}, aqui é da AutoCasteloBranco.`)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"><MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp</a>}
              {lead.email && <a href={`mailto:${lead.email}`} className="btn btn-secondary"><Mail className="h-4 w-4" aria-hidden="true" /> {lead.email}</a>}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
