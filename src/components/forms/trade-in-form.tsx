"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, Trash2 } from "lucide-react";
import { submitTradeIn } from "@/app/actions/trade-in";
import { resizeImage } from "@/lib/image-resize";
import { FUEL_KEYS, FUEL_LABELS, GEARBOX_KEYS, GEARBOX_LABELS } from "@/lib/labels";
import {
  ACCIDENT_LABELS,
  CONDITION_LABELS,
  SERVICEBOOK_LABELS,
  formDataToObject,
  tradeInContactSchema,
  tradeInStateSchema,
  tradeInVehicleSchema,
  zodErrors,
  type FieldErrors,
} from "@/lib/schemas";
import { cn } from "@/lib/format";
import { AntiSpamFields, ConsentField, Field, FormStatus, SubmitButton } from "./form-kit";

const STEPS = ["Viatura", "Estado", "Fotografias", "Contacto"] as const;
const MAX_PHOTOS = 6;

type Photo = { id: string; blob: Blob; url: string };

function RadioCards<T extends string>({ name, options, error, legend }: { name: string; options: Record<T, string>; error?: string; legend: string }) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-e` : undefined}>
      <legend className="label">{legend} <span aria-hidden="true" className="text-signal-ink">*</span></legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.entries(options) as [T, string][]).map(([value, label]) => (
          <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-surface px-3.5 text-[15px] transition-colors duration-150 hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-subtle has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
            <input type="radio" name={name} value={value} className="h-4 w-4 accent-[#111214]" />
            {label}
          </label>
        ))}
      </div>
      {error && <p id={`${id}-e`} className="field-error">{error}</p>}
    </fieldset>
  );
}

export function TradeInForm({ vehicleOptions }: { vehicleOptions: string[] }) {
  const [state, formAction, pending] = useActionState(submitTradeIn, null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const year = new Date().getFullYear();

  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) {
      photos.forEach((x) => URL.revokeObjectURL(x.url));
      setPhotos([]);
    }
    if (state?.errors) {
      setErrors(state.errors);
      const keys = Object.keys(state.errors);
      const vehicleKeys = Object.keys(tradeInVehicleSchema.shape);
      const stateKeys = Object.keys(tradeInStateSchema.shape);
      setStep(keys.some((k) => vehicleKeys.includes(k)) ? 0 : keys.some((k) => stateKeys.includes(k)) ? 1 : 3);
    }
  }

  useEffect(() => headingRef.current?.focus({ preventScroll: true }), [step]);

  const validateStep = (i: number): boolean => {
    if (!formRef.current) return false;
    const data = formDataToObject(new FormData(formRef.current));
    const schema = i === 0 ? tradeInVehicleSchema : i === 1 ? tradeInStateSchema : i === 3 ? tradeInContactSchema : null;
    if (!schema) return true;
    const r = schema.safeParse(data);
    if (r.success) {
      setErrors({});
      return true;
    }
    const errs = zodErrors(r.error);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) formRef.current.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    return false;
  };

  const next = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setPhotoError(null);
    const room = MAX_PHOTOS - photos.length;
    const files = Array.from(list).slice(0, room);
    if (list.length > room) setPhotoError(`Pode enviar até ${MAX_PHOTOS} fotografias.`);
    setProcessing(true);
    const added: Photo[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        setPhotoError("Só são aceites imagens.");
        continue;
      }
      try {
        const { blob } = await resizeImage(f, 1400, 0.8);
        added.push({ id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) });
      } catch (e) {
        setPhotoError(e instanceof Error ? e.message : "Erro ao processar a imagem.");
      }
    }
    setPhotos((p) => [...p, ...added]);
    setProcessing(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      next();
      return;
    }
    for (let i = 0; i < STEPS.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    const fd = new FormData(e.currentTarget);
    fd.delete("photos");
    photos.forEach((p, i) => fd.append("photos", p.blob, `foto-${i + 1}.${p.blob.type === "image/webp" ? "webp" : "jpg"}`));
    startTransition(() => formAction(fd));
  };

  if (state?.ok) {
    return (
      <div className="card p-8 text-center md:p-12" role="status">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok-soft text-ok"><Check className="h-7 w-7" aria-hidden="true" /></span>
        <h2 className="mt-5 text-2xl">Pedido de avaliação recebido</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-2">{state.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/viaturas" className="btn btn-primary">Ver viaturas</Link>
          <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>Avaliar outra viatura</button>
        </div>
      </div>
    );
  }

  const section = (i: number) => cn("grid gap-4", step !== i && "hidden");

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="card relative overflow-hidden">
      <AntiSpamFields />
      <ol className="grid grid-cols-4 border-b border-line" aria-label="Passos">
        {STEPS.map((s, i) => (
          <li key={s} className={cn("relative px-2 py-3 text-center text-[13px] md:px-4 md:text-sm", i === step ? "font-semibold text-ink" : i < step ? "text-ink-2" : "text-muted")} aria-current={i === step ? "step" : undefined}>
            <span className="num mr-1.5 hidden text-[11px] sm:inline">0{i + 1}</span>
            {s}
            {i < step && <span className="sr-only"> (concluído)</span>}
            <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-[3px] transition-colors duration-200", i <= step ? "bg-signal" : "bg-transparent")} />
          </li>
        ))}
      </ol>

      <div className="p-5 md:p-8">
        <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-xl outline-none">
          Passo {step + 1} de {STEPS.length}: {STEPS[step]}
        </h2>

        <div className={section(0)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca" name="brand" required error={errors.brand} autoComplete="off" />
            <Field label="Modelo" name="model" required error={errors.model} autoComplete="off" />
          </div>
          <Field label="Versão" name="version" error={errors.version} placeholder="Ex.: 1.5 dCi Limited" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ano" name="year" type="number" inputMode="numeric" min={1990} max={year + 1} required error={errors.year} className="sm:col-span-1" />
            <Field label="Quilómetros" name="km" type="number" inputMode="numeric" min={0} step={1000} required error={errors.km} className="sm:col-span-1" />
            <Field label="Matrícula" name="plate" error={errors.plate} placeholder="AA-00-AA" autoCapitalize="characters" className="sm:col-span-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Combustível" name="fuel" required error={errors.fuel}>
              {(p) => (
                <select className="input" defaultValue="" {...p}>
                  <option value="" disabled>Escolher…</option>
                  {FUEL_KEYS.map((k) => <option key={k} value={k}>{FUEL_LABELS[k]}</option>)}
                </select>
              )}
            </Field>
            <Field label="Caixa" name="gearbox" required error={errors.gearbox}>
              {(p) => (
                <select className="input" defaultValue="" {...p}>
                  <option value="" disabled>Escolher…</option>
                  {GEARBOX_KEYS.map((k) => <option key={k} value={k}>{GEARBOX_LABELS[k]}</option>)}
                </select>
              )}
            </Field>
          </div>
        </div>

        <div className={section(1)}>
          <RadioCards legend="Estado geral" name="condition" options={CONDITION_LABELS} error={errors.condition} />
          <RadioCards legend="Acidentes" name="accidents" options={ACCIDENT_LABELS} error={errors.accidents} />
          <RadioCards legend="Histórico de manutenção" name="serviceBook" options={SERVICEBOOK_LABELS} error={errors.serviceBook} />
          <Field label="Notas" name="notes" error={errors.notes}>
            {(p) => <textarea className="input" placeholder="Riscos, avarias conhecidas, pneus novos, extras…" {...p} />}
          </Field>
        </div>

        <div className={section(2)}>
          <p className="text-ink-2">Fotografias ajudam-nos a dar um valor mais preciso: frente, traseira, laterais, interior e conta-quilómetros. Até {MAX_PHOTOS}.</p>
          <div>
            <input
              ref={fileRef}
              id="retoma-fotos"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
              disabled={photos.length >= MAX_PHOTOS || processing}
            />
            <label
              htmlFor="retoma-fotos"
              className={cn(
                "tick-grid flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong p-6 text-center transition-colors duration-150 hover:border-ink",
                (photos.length >= MAX_PHOTOS || processing) && "pointer-events-none opacity-60",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void addFiles(e.dataTransfer.files);
              }}
            >
              <Camera className="h-6 w-6" aria-hidden="true" />
              <span className="font-medium">{processing ? "A preparar fotografias…" : "Tirar ou escolher fotografias"}</span>
              <span className="num text-xs text-muted">{photos.length}/{MAX_PHOTOS} · JPG, PNG, WebP</span>
            </label>
            {photoError && <p className="field-error" role="alert">{photoError}</p>}
          </div>
          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {photos.map((p, i) => (
                <li key={p.id} className="relative aspect-square overflow-hidden rounded-xl border border-line">
                  <Image src={p.url} alt={`Fotografia ${i + 1}`} fill unoptimized className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.url);
                      setPhotos((list) => list.filter((x) => x.id !== p.id));
                    }}
                    className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-surface/95"
                    aria-label={`Remover fotografia ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">Pode avançar sem fotografias — nesse caso pedimos para ver a viatura.</p>
        </div>

        <div className={section(3)}>
          <Field label="Nome" name="name" autoComplete="name" required error={errors.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required error={errors.phone} />
            <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
          </div>
          <Field label="Viatura do stand que lhe interessa" name="interestVehicle" error={errors.interestVehicle}>
            {(p) => (
              <select className="input" defaultValue="" {...p}>
                <option value="">Ainda não sei / só quero vender</option>
                {vehicleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
          </Field>
          <ConsentField error={errors.consent} />
        </div>

        <div className="mt-6">
          <FormStatus state={state && !state.ok ? state : null} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-5">
          <button type="button" className={cn("btn btn-ghost", step === 0 && "invisible")} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Anterior
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-dark" onClick={next} disabled={processing}>
              Seguinte <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <SubmitButton pending={pending}>Pedir avaliação</SubmitButton>
          )}
        </div>
      </div>
    </form>
  );
}
