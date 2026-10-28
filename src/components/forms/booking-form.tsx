"use client";

import Link from "next/link";
import { startTransition, useActionState, useCallback, useEffect, useRef, useState } from "react";
import { CalendarPlus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { submitBooking } from "@/app/actions/booking";
import { bookingSchema, formDataToObject, zodErrors, type FieldErrors } from "@/lib/schemas";
import { addDaysIso, cn, formatDate, formatDayShort, formatPrice } from "@/lib/format";
import { AntiSpamFields, ConsentField, Field, FormStatus, SubmitButton } from "./form-kit";

type Service = { id: string; slug: string; name: string; priceFrom: number | null; durationMinutes: number };
type Day = { day: string; closed: boolean; reason?: string; slots: { time: string; free: number; capacity: number }[] };

const WINDOW = 14;

function icsFor(ref: string, service: string, day: string, time: string, minutes: number, address: string) {
  const [y, m, d] = day.split("-");
  const [hh, mm] = time.split(":").map(Number);
  const end = (hh ?? 0) * 60 + (mm ?? 0) + minutes;
  const fmt = (h: number, mi: number) => `${y}${m}${d}T${String(h).padStart(2, "0")}${String(mi).padStart(2, "0")}00`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AutoCasteloBranco//Oficina//PT",
    "BEGIN:VEVENT",
    `UID:${ref}@autocastelobranco.example`,
    `DTSTART;TZID=Europe/Lisbon:${fmt(hh ?? 0, mm ?? 0)}`,
    `DTEND;TZID=Europe/Lisbon:${fmt(Math.floor(end / 60), end % 60)}`,
    `SUMMARY:Oficina AutoCasteloBranco — ${service}`,
    `LOCATION:${address.replace(/,/g, "\\,")}`,
    `DESCRIPTION:Referência ${ref}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

export function BookingForm({ services, initialServiceSlug, address }: { services: Service[]; initialServiceSlug?: string; address: string }) {
  const [state, formAction, pending] = useActionState(submitBooking, null);
  const [serviceId, setServiceId] = useState(() => services.find((s) => s.slug === initialServiceSlug)?.id ?? "");
  const [from, setFrom] = useState<string | null>(null);
  const [bounds, setBounds] = useState<{ today: string; maxDay: string } | null>(null);
  const [days, setDays] = useState<Day[] | null>(null);
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Nota: quem chama é responsável por pôr loading=true (evita setState síncrono no efeito inicial)
  const load = useCallback(async (start: string | null) => {
    try {
      const res = await fetch(`/api/workshop/availability?days=${WINDOW}${start ? `&from=${start}` : ""}`, { cache: "no-store" });
      const data = (await res.json()) as { today: string; maxDay: string; days: Day[] };
      setBounds({ today: data.today, maxDay: data.maxDay });
      setDays(data.days);
      setFrom(data.days[0]?.day ?? data.today);
      return data.days;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(null).then((list) => {
      const first = list.find((d) => !d.closed && d.slots.some((s) => s.free > 0));
      if (first) setDay(first.day);
    });
  }, [load]);

  // Após erro de vaga ocupada, recarrega a disponibilidade real
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state && !state.ok) {
      setErrors(state.errors ?? {});
      if (state.errors?.time) {
        setTime("");
        setLoading(true);
        void load(from);
      }
    }
  }

  const current = days?.find((d) => d.day === day);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = bookingSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) {
      const errs = zodErrors(parsed.error);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      const el = first === "time" || first === "day" ? document.getElementById("marcar-horas") : e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setErrors({});
    startTransition(() => formAction(fd));
  };

  if (state?.ok) {
    const svc = services.find((s) => s.id === serviceId);
    return (
      <div className="card p-6 md:p-10" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ok-soft text-ok"><Check className="h-7 w-7" aria-hidden="true" /></span>
        <h3 className="mt-5 text-2xl">Marcação registada</h3>
        <p className="mt-2 text-ink-2">{state.message} Enviámos a confirmação para o seu email.</p>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {[
            ["Referência", state.ref ?? "—"],
            ["Serviço", svc?.name ?? "—"],
            ["Data", `${formatDate(day)} · ${time}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="spec-label">{k}</dt>
              <dd className="num mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {state.ref && svc && (
            <a className="btn btn-dark" download={`marcacao-${state.ref}.ics`} href={icsFor(state.ref, svc.name, day, time, svc.durationMinutes, address)}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Adicionar ao calendário
            </a>
          )}
          <Link href="/viaturas" className="btn btn-secondary">Ver viaturas</Link>
        </div>
      </div>
    );
  }

  const canPrev = bounds && from && from > bounds.today;
  const canNext = bounds && from && addDaysIso(from, WINDOW) <= bounds.maxDay;

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="card relative">
      <AntiSpamFields />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="time" value={time} />

      <fieldset className="border-b border-line p-5 md:p-6">
        <legend className="sr-only">Serviço</legend>
        <p className="spec-label mb-3">1 · Serviço</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label key={s.id} className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line-strong px-3.5 py-2 transition-colors duration-150 hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-subtle has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
              <span className="flex items-center gap-3">
                <input type="radio" name="serviceId" value={s.id} checked={serviceId === s.id} onChange={() => setServiceId(s.id)} className="h-4 w-4 accent-[#111214]" />
                <span className="text-[15px] font-medium">{s.name}</span>
              </span>
              {s.priceFrom != null && <span className="num shrink-0 text-[13px] text-muted">desde {formatPrice(s.priceFrom)}</span>}
            </label>
          ))}
        </div>
        {errors.serviceId && <p className="field-error">{errors.serviceId}</p>}
      </fieldset>

      <div className="border-b border-line p-5 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="spec-label">2 · Dia e hora</p>
          <div className="flex gap-1">
            <button type="button" className="btn btn-secondary btn-icon !h-10 !min-h-10 !w-10" disabled={!canPrev || loading} onClick={() => { if (!from) return; setLoading(true); void load(addDaysIso(from, -WINDOW)); }} aria-label="Dias anteriores">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-secondary btn-icon !h-10 !min-h-10 !w-10" disabled={!canNext || loading} onClick={() => { if (!from) return; setLoading(true); void load(addDaysIso(from, WINDOW)); }} aria-label="Dias seguintes">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div role="group" aria-label="Escolha o dia" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]" aria-busy={loading}>
          {!days
            ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton h-[76px] w-[68px] shrink-0" />)
            : days.map((d) => {
                const free = d.slots.reduce((a, s) => a + s.free, 0);
                const disabled = d.closed || free === 0;
                const [wd, rest] = formatDayShort(d.day).split(", ");
                return (
                  <button
                    key={d.day}
                    type="button"
                    aria-pressed={day === d.day}
                    data-day={d.day}
                    disabled={disabled}
                    onClick={() => {
                      setDay(d.day);
                      setTime("");
                    }}
                    className={cn(
                      "relative flex w-[68px] shrink-0 flex-col items-center rounded-xl border px-1 py-2 transition-colors duration-150",
                      day === d.day ? "border-ink bg-ink text-white" : "border-line-strong bg-surface hover:border-ink",
                      disabled && "cursor-not-allowed border-line bg-bg text-muted opacity-60 hover:border-line",
                    )}
                  >
                    <span className="text-[11px] uppercase tracking-wide">{wd}</span>
                    <span className="num text-lg font-semibold leading-tight">{rest?.split(" ")[0]}</span>
                    <span className="text-[11px]">{rest?.split(" ")[1]}</span>
                    <span className="sr-only">{` ${d.day.slice(0, 4)} — ${disabled ? (d.reason ?? "sem vagas") : `${free} vagas`}`}</span>
                    <span className={cn("mt-1 h-1 w-4 rounded-full", disabled ? "bg-line-strong" : free <= 2 ? "bg-signal" : "bg-ok")} aria-hidden="true" />
                  </button>
                );
              })}
        </div>
        <div id="marcar-horas" tabIndex={-1} className="mt-4 min-h-[156px] outline-none">
          {current && !current.closed ? (
            <>
              <p className="mb-2 text-sm text-ink-2">Horas disponíveis a <strong className="num">{formatDate(current.day)}</strong></p>
              <div role="group" aria-label="Escolha a hora" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {current.slots.map((s) => {
                  const full = s.free === 0;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      aria-pressed={time === s.time}
                      disabled={full}
                      onClick={() => setTime(s.time)}
                      data-time={s.time}
                      className={cn(
                        "num flex min-h-12 flex-col items-center justify-center rounded-xl border text-[15px] font-medium transition-colors duration-150",
                        time === s.time ? "border-signal bg-signal text-ink" : "border-line-strong bg-surface hover:border-ink",
                        full && "cursor-not-allowed border-line bg-bg text-muted line-through hover:border-line",
                      )}
                    >
                      {s.time}
                      <span className="text-[10px] font-normal no-underline">{full ? "esgotado" : `${s.free} ${s.free === 1 ? "vaga" : "vagas"}`}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">{loading ? "A carregar vagas…" : "Escolha um dia com vagas."}</p>
          )}
          {(errors.time || errors.day) && <p className="field-error">{errors.time ?? errors.day}</p>}
        </div>
      </div>

      <div className="grid gap-4 p-5 md:p-6">
        <p className="spec-label">3 · Os seus dados</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marca e modelo da viatura" name="vehicleInfo" required error={errors.vehicleInfo} placeholder="Ex.: Renault Clio 2018" />
          <Field label="Matrícula" name="plate" error={errors.plate} placeholder="AA-00-AA" autoCapitalize="characters" />
        </div>
        <Field label="Nome" name="name" autoComplete="name" required error={errors.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required error={errors.phone} />
          <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} hint="Enviamos a confirmação para aqui." />
        </div>
        <Field label="Descreva o problema ou pedido" name="notes" error={errors.notes}>
          {(p) => <textarea className="input !min-h-24" {...p} />}
        </Field>
        <ConsentField error={errors.consent} />
        <FormStatus state={state} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="num text-sm text-ink-2">
            {day && time ? <>Selecionado: <strong>{formatDate(day)} · {time}</strong></> : "Escolha o dia e a hora acima."}
          </p>
          <SubmitButton pending={pending}>Confirmar marcação</SubmitButton>
        </div>
      </div>
    </form>
  );
}
