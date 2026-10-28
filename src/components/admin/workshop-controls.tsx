"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addBlockedDay, deleteService, removeBlockedDay, saveBookingNotes, saveService, saveSlotsConfig, setBookingStatus } from "@/app/admin/actions/workshop";
import { FormStatus, SubmitButton } from "@/components/forms/form-kit";
import { toast } from "@/components/ui/toast";
import { BOOKING_STATUS_KEYS, BOOKING_STATUS_LABELS, WEEKDAY_LABELS, type BookingStatusKey } from "@/lib/labels";
import { cn } from "@/lib/format";

export function BookingStatusSelect({ id, status, label }: { id: string; status: BookingStatusKey; label: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={`Estado da marcação de ${label}`}
      className={cn("input !min-h-9 !w-auto !py-1 text-sm", pending && "opacity-60")}
      value={status}
      disabled={pending}
      onChange={(e) => {
        const s = e.target.value as BookingStatusKey;
        start(async () => { await setBookingStatus(id, s); toast(`Marcação: ${BOOKING_STATUS_LABELS[s]}`); });
      }}
    >
      {BOOKING_STATUS_KEYS.map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>)}
    </select>
  );
}

export function BookingNotes({ id, value }: { id: string; value: string }) {
  const [, start] = useTransition();
  return (
    <>
      <label className="sr-only" htmlFor={`bn-${id}`}>Notas internas</label>
      <input
        id={`bn-${id}`}
        className="input !min-h-9 !py-1 text-sm"
        defaultValue={value}
        placeholder="Notas internas…"
        onBlur={(e) => e.target.value !== value && start(async () => { await saveBookingNotes(id, e.target.value); toast("Nota guardada"); })}
      />
    </>
  );
}

type Service = { id: string; name: string; description: string; priceFrom: number | null; durationMinutes: number; position: number; active: boolean };

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action, pending] = useActionState(saveService, null);
  const [delPending, startDel] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && !service) ref.current?.reset();
    if (state?.ok) toast(state.message);
  }, [state, service]);
  const e = state?.errors ?? {};
  const id = service?.id ?? "novo";
  return (
    <form ref={ref} action={action} className="grid gap-3 md:grid-cols-12 md:items-end">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="md:col-span-3">
        <label className="label" htmlFor={`s-name-${id}`}>Nome</label>
        <input id={`s-name-${id}`} name="name" className="input" defaultValue={service?.name} aria-invalid={e.name ? true : undefined} />
      </div>
      <div className="md:col-span-4">
        <label className="label" htmlFor={`s-desc-${id}`}>Descrição</label>
        <input id={`s-desc-${id}`} name="description" className="input" defaultValue={service?.description} />
      </div>
      <div className="md:col-span-1">
        <label className="label" htmlFor={`s-price-${id}`}>Desde (€)</label>
        <input id={`s-price-${id}`} name="priceFrom" type="number" className="input num" defaultValue={service?.priceFrom ?? ""} />
      </div>
      <div className="md:col-span-1">
        <label className="label" htmlFor={`s-dur-${id}`}>Min.</label>
        <input id={`s-dur-${id}`} name="durationMinutes" type="number" className="input num" defaultValue={service?.durationMinutes ?? 60} />
      </div>
      <div className="md:col-span-1">
        <label className="label" htmlFor={`s-pos-${id}`}>Ordem</label>
        <input id={`s-pos-${id}`} name="position" type="number" className="input num" defaultValue={service?.position ?? 0} />
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={service?.active ?? true} className="h-5 w-5 accent-[#111214]" /> Ativo</label>
        <SubmitButton pending={pending} className="!w-auto btn-sm">{service ? "Guardar" : "Criar"}</SubmitButton>
        {service && (
          <button type="button" disabled={delPending} className="grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-danger-soft" aria-label={`Apagar ${service.name}`} onClick={() => confirm(`Apagar o serviço «${service.name}»? As marcações existentes mantêm-se.`) && startDel(() => deleteService(service.id))}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {state && !state.ok && <div className="md:col-span-12"><FormStatus state={state} /></div>}
    </form>
  );
}

type Cfg = { weekday: number; isOpen: boolean; openTime: string; closeTime: string; breakStart: string | null; breakEnd: string | null; slotMinutes: number; capacity: number };

export function SlotsConfigForm({ configs }: { configs: Cfg[] }) {
  const [state, action, pending] = useActionState(saveSlotsConfig, null);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <form action={action} className="grid gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-muted">
            <tr className="[&>th]:p-2 [&>th]:font-medium">
              <th scope="col">Dia</th><th scope="col">Aberto</th><th scope="col">Abre</th><th scope="col">Fecha</th><th scope="col">Pausa início</th><th scope="col">Pausa fim</th><th scope="col">Slot (min)</th><th scope="col">Vagas/slot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.map((wd) => {
              const c = configs.find((x) => x.weekday === wd) ?? { weekday: wd, isOpen: false, openTime: "09:00", closeTime: "18:00", breakStart: null, breakEnd: null, slotMinutes: 60, capacity: 2 };
              const err = state?.errors?.[`day_${wd}`];
              const day = WEEKDAY_LABELS[wd];
              return (
                <tr key={wd} className={err ? "bg-danger-soft" : ""}>
                  <th scope="row" className="p-2 text-left font-medium">{day}{err && <p className="field-error !mt-0 font-normal">{err}</p>}</th>
                  <td className="p-2"><input type="checkbox" name={`open_${wd}`} defaultChecked={c.isOpen} aria-label={`${day} aberto`} className="h-5 w-5 accent-[#111214]" /></td>
                  <td className="p-2"><input type="time" name={`openTime_${wd}`} defaultValue={c.openTime} aria-label={`${day}: abertura`} className="input num !min-h-10" /></td>
                  <td className="p-2"><input type="time" name={`closeTime_${wd}`} defaultValue={c.closeTime} aria-label={`${day}: fecho`} className="input num !min-h-10" /></td>
                  <td className="p-2"><input type="time" name={`breakStart_${wd}`} defaultValue={c.breakStart ?? ""} aria-label={`${day}: início da pausa`} className="input num !min-h-10" /></td>
                  <td className="p-2"><input type="time" name={`breakEnd_${wd}`} defaultValue={c.breakEnd ?? ""} aria-label={`${day}: fim da pausa`} className="input num !min-h-10" /></td>
                  <td className="p-2"><input type="number" name={`slot_${wd}`} min={15} step={15} defaultValue={c.slotMinutes} aria-label={`${day}: duração do slot`} className="input num !min-h-10 w-24" /></td>
                  <td className="p-2"><input type="number" name={`capacity_${wd}`} min={0} max={50} defaultValue={c.capacity} aria-label={`${day}: vagas por slot`} className="input num !min-h-10 w-20" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormStatus state={state} />
        <SubmitButton pending={pending}>Guardar horário</SubmitButton>
      </div>
    </form>
  );
}

export function BlockedDayForm({ min }: { min: string }) {
  const [state, action, pending] = useActionState(addBlockedDay, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <div>
        <label className="label" htmlFor="bd-day">Data</label>
        <input id="bd-day" type="date" name="day" min={min} className="input num" required />
      </div>
      <div>
        <label className="label" htmlFor="bd-reason">Motivo</label>
        <input id="bd-reason" name="reason" className="input" placeholder="Ex.: Feriado municipal" />
      </div>
      <SubmitButton pending={pending}>Bloquear dia</SubmitButton>
      <div className="sm:col-span-3"><FormStatus state={state} /></div>
    </form>
  );
}

export function RemoveBlockedDay({ day, label }: { day: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { await removeBlockedDay(day); toast("Dia desbloqueado"); })} className="btn btn-ghost btn-sm" aria-label={`Desbloquear ${label}`}>
      <Trash2 className="h-4 w-4" aria-hidden="true" /> Remover
    </button>
  );
}
