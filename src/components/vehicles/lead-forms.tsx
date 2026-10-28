"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { submitInfoRequest, submitTestDrive } from "@/app/actions/leads";
import { AntiSpamFields, ConsentField, Field, FormStatus, SubmitButton, useZodAction } from "@/components/forms/form-kit";
import { infoLeadSchema, testDriveSchema } from "@/lib/schemas";
import { testDriveDateBounds, testDriveTimes } from "@/lib/test-drive";
import { cn, isoDayLisbon } from "@/lib/format";

function InfoForm({ vehicleId, title, path }: { vehicleId: string; title: string; path: string }) {
  const { state, pending, errors, onSubmit, formRef, formAction } = useZodAction(submitInfoRequest, infoLeadSchema);
  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="relative grid gap-4">
      <AntiSpamFields />
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="path" value={path} />
      <Field label="Nome" name="name" autoComplete="name" required error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
        <Field label="Telefone" name="phone" type="tel" autoComplete="tel" inputMode="tel" error={errors.phone} />
      </div>
      <Field label="Mensagem" name="message" required error={errors.message}>
        {(p) => <textarea className="input" {...p} defaultValue={`Olá, gostaria de mais informações sobre o ${title}.`} />}
      </Field>
      <ConsentField error={errors.consent} />
      <FormStatus state={state} />
      <SubmitButton pending={pending}>Enviar pedido</SubmitButton>
    </form>
  );
}

function TestDriveForm({ vehicleId, path }: { vehicleId: string; path: string }) {
  const { state, pending, errors, onSubmit, formRef, formAction } = useZodAction(submitTestDrive, testDriveSchema);
  const bounds = useMemo(() => testDriveDateBounds(isoDayLisbon(new Date())), []);
  const [day, setDay] = useState(bounds.min);
  const times = testDriveTimes(day);
  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="relative grid gap-4">
      <AntiSpamFields />
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="path" value={path} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" name="preferredDate" required error={errors.preferredDate} hint="De segunda a sábado.">
          {(p) => <input type="date" className="input num" min={bounds.min} max={bounds.max} value={day} onChange={(e) => setDay(e.target.value)} {...p} />}
        </Field>
        <Field label="Hora" name="preferredTime" required error={errors.preferredTime}>
          {(p) => (
            <select className="input num" {...p} disabled={!times.length} key={day}>
              {times.length ? times.map((t) => <option key={t} value={t}>{t}</option>) : <option value="">Encerrado ao domingo</option>}
            </select>
          )}
        </Field>
      </div>
      <Field label="Nome" name="name" autoComplete="name" required error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required error={errors.phone} />
        <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      </div>
      <Field label="Observações" name="message" error={errors.message}>
        {(p) => <textarea className="input !min-h-20" {...p} placeholder="Ex.: prefiro experimentar em autoestrada" />}
      </Field>
      <ConsentField error={errors.consent} />
      <FormStatus state={state} />
      <SubmitButton pending={pending}>Pedir test-drive</SubmitButton>
      <p className="text-xs text-muted">Traga a carta de condução. Confirmamos a hora por telefone.</p>
    </form>
  );
}

const TABS = [
  { key: "info", label: "Pedir informação" },
  { key: "test", label: "Marcar test-drive" },
] as const;

export function LeadForms({ vehicleId, title, path }: { vehicleId: string; title: string; path: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("info");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const onOpen = () => setTab("test");
    window.addEventListener("acb:test-drive", onOpen);
    if (location.hash === "#marcar-visita") requestAnimationFrame(onOpen);
    return () => window.removeEventListener("acb:test-drive", onOpen);
  }, []);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next]!.key);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="marcar-visita" aria-labelledby="contactar-titulo" className="card scroll-mt-24 p-5 md:p-6">
      <h2 id="contactar-titulo" className="text-xl">Interessado?</h2>
      <div role="tablist" aria-label="Tipo de pedido" className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            tabIndex={tab === t.key ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => setTab(t.key)}
            className={cn("min-h-11 rounded-lg text-sm font-medium transition-colors duration-150", tab === t.key ? "bg-surface shadow-sm" : "text-ink-2 hover:text-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <div role="tabpanel" id="panel-info" aria-labelledby="tab-info" hidden={tab !== "info"}>
          <InfoForm vehicleId={vehicleId} title={title} path={path} />
        </div>
        <div role="tabpanel" id="panel-test" aria-labelledby="tab-test" hidden={tab !== "test"}>
          <TestDriveForm vehicleId={vehicleId} path={path} />
        </div>
      </div>
    </section>
  );
}
