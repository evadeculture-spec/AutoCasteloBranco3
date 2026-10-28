"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveVehicle } from "@/app/admin/actions/vehicles";
import { FormStatus, SubmitButton } from "@/components/forms/form-kit";
import type { HistoryEntry, Vehicle } from "@/db/schema";
import { BODY_KEYS, BODY_LABELS, FEATURE_CATEGORY_KEYS, FEATURE_CATEGORY_LABELS, FUEL_KEYS, FUEL_LABELS, GEARBOX_KEYS, GEARBOX_LABELS, STATUS_KEYS, STATUS_LABELS, type FeatureCategoryKey } from "@/lib/labels";
import { slugify } from "@/lib/format";

type Props = { vehicle?: Vehicle; features?: { category: FeatureCategoryKey; label: string }[] };

function F({ label, name, error, children, hint, className }: { label: string; name: string; error?: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
      {error && <p className="field-error" id={`f-${name}-err`}>{error}</p>}
    </div>
  );
}

export function VehicleForm({ vehicle: v, features = [] }: Props) {
  const [state, action, pending] = useActionState(saveVehicle, null);
  const e = state?.errors ?? {};
  const [history, setHistory] = useState<HistoryEntry[]>(v?.history ?? []);
  const [title, setTitle] = useState({ brand: v?.brand ?? "", model: v?.model ?? "", version: v?.version ?? "", year: String(v?.year ?? "") });
  const autoSlug = slugify(`${title.brand} ${title.model} ${title.version} ${title.year}`);
  const sel = (name: string) => ({
    id: `f-${name}`,
    name,
    className: "input",
    "aria-invalid": e[name] ? true : undefined,
    "aria-describedby": e[name] ? `f-${name}-err` : undefined,
  });
  const inp = (name: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => ({
    id: `f-${name}`,
    name,
    className: "input",
    "aria-invalid": e[name] ? true : undefined,
    "aria-describedby": e[name] ? `f-${name}-err` : undefined,
    ...extra,
  });

  return (
    <form action={action} className="grid gap-6" noValidate>
      {v && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="history" value={JSON.stringify(history)} />

      <section className="card grid gap-4 p-5 md:p-6">
        <h2 className="text-lg">Publicação</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <F label="Estado" name="status" error={e.status}>
            <select {...sel("status")} defaultValue={v?.status ?? "rascunho"}>
              {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </F>
          <F label="Slug (URL)" name="slug" error={e.slug} hint={`Vazio = automático: /viaturas/${autoSlug || "…"}`} className="md:col-span-2">
            <input {...inp("slug")} defaultValue={v?.slug ?? ""} placeholder={autoSlug} />
          </F>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="inline-flex min-h-11 items-center gap-2.5 text-sm font-medium"><input type="checkbox" name="featured" defaultChecked={v?.featured} className="h-5 w-5 accent-[#111214]" /> Destaque na página inicial</label>
          <label className="inline-flex min-h-11 items-center gap-2.5 text-sm font-medium"><input type="checkbox" name="revised" defaultChecked={v?.revised ?? true} className="h-5 w-5 accent-[#111214]" /> Revisto (inspeção feita)</label>
          <label className="inline-flex min-h-11 items-center gap-2.5 text-sm font-medium"><input type="checkbox" name="vatDeductible" defaultChecked={v?.vatDeductible} className="h-5 w-5 accent-[#111214]" /> IVA dedutível</label>
        </div>
      </section>

      <section className="card grid gap-4 p-5 md:p-6">
        <h2 className="text-lg">Identificação e preço</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <F label="Marca *" name="brand" error={e.brand}><input {...inp("brand")} defaultValue={v?.brand} onChange={(ev) => setTitle((t) => ({ ...t, brand: ev.target.value }))} /></F>
          <F label="Modelo *" name="model" error={e.model}><input {...inp("model")} defaultValue={v?.model} onChange={(ev) => setTitle((t) => ({ ...t, model: ev.target.value }))} /></F>
          <F label="Versão" name="version" error={e.version}><input {...inp("version")} defaultValue={v?.version} onChange={(ev) => setTitle((t) => ({ ...t, version: ev.target.value }))} /></F>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <F label="Ano *" name="year" error={e.year}><input {...inp("year", { type: "number", inputMode: "numeric" })} defaultValue={v?.year} onChange={(ev) => setTitle((t) => ({ ...t, year: ev.target.value }))} /></F>
          <F label="Mês" name="month" error={e.month}><input {...inp("month", { type: "number", min: 1, max: 12 })} defaultValue={v?.month ?? ""} /></F>
          <F label="Quilómetros *" name="km" error={e.km}><input {...inp("km", { type: "number", inputMode: "numeric" })} defaultValue={v?.km} /></F>
          <F label="Preço (€, IVA incl.) *" name="price" error={e.price}><input {...inp("price", { type: "number", inputMode: "numeric" })} defaultValue={v?.price} /></F>
          <F label="Preço anterior (€)" name="previousPrice" error={e.previousPrice} hint="Mostra «Baixou»"><input {...inp("previousPrice", { type: "number" })} defaultValue={v?.previousPrice ?? ""} /></F>
          <F label="Garantia (meses)" name="warrantyMonths" error={e.warrantyMonths}><input {...inp("warrantyMonths", { type: "number" })} defaultValue={v?.warrantyMonths ?? 18} /></F>
        </div>
      </section>

      <section className="card grid gap-4 p-5 md:p-6">
        <h2 className="text-lg">Ficha técnica</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <F label="Combustível *" name="fuel" error={e.fuel}>
            <select {...sel("fuel")} defaultValue={v?.fuel ?? "gasolina"}>{FUEL_KEYS.map((k) => <option key={k} value={k}>{FUEL_LABELS[k]}</option>)}</select>
          </F>
          <F label="Caixa *" name="gearbox" error={e.gearbox}>
            <select {...sel("gearbox")} defaultValue={v?.gearbox ?? "manual"}>{GEARBOX_KEYS.map((k) => <option key={k} value={k}>{GEARBOX_LABELS[k]}</option>)}</select>
          </F>
          <F label="Tipologia *" name="bodyType" error={e.bodyType}>
            <select {...sel("bodyType")} defaultValue={v?.bodyType ?? "utilitario"}>{BODY_KEYS.map((k) => <option key={k} value={k}>{BODY_LABELS[k]}</option>)}</select>
          </F>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <F label="Potência (cv)" name="powerHp" error={e.powerHp}><input {...inp("powerHp", { type: "number" })} defaultValue={v?.powerHp ?? ""} /></F>
          <F label="Cilindrada (cm³)" name="engineCc" error={e.engineCc}><input {...inp("engineCc", { type: "number" })} defaultValue={v?.engineCc ?? ""} /></F>
          <F label="Bateria (kWh)" name="batteryKwh" error={e.batteryKwh}><input {...inp("batteryKwh", { type: "number" })} defaultValue={v?.batteryKwh ?? ""} /></F>
          <F label="Autonomia (km)" name="rangeKm" error={e.rangeKm}><input {...inp("rangeKm", { type: "number" })} defaultValue={v?.rangeKm ?? ""} /></F>
          <F label="Portas" name="doors" error={e.doors}><input {...inp("doors", { type: "number" })} defaultValue={v?.doors ?? 5} /></F>
          <F label="Lugares" name="seats" error={e.seats}><input {...inp("seats", { type: "number" })} defaultValue={v?.seats ?? 5} /></F>
          <F label="N.º de donos" name="owners" error={e.owners}><input {...inp("owners", { type: "number" })} defaultValue={v?.owners ?? ""} /></F>
          <F label="CO₂ (g/km)" name="co2" error={e.co2}><input {...inp("co2", { type: "number" })} defaultValue={v?.co2 ?? ""} /></F>
          <F label="Cor" name="color" error={e.color} className="col-span-2"><input {...inp("color")} defaultValue={v?.color} /></F>
          <F label="Consumo" name="consumption" error={e.consumption} className="col-span-2"><input {...inp("consumption")} defaultValue={v?.consumption} placeholder="5,2 l/100 km" /></F>
        </div>
        <F label="Descrição" name="description" error={e.description}>
          <textarea id="f-description" name="description" className="input" defaultValue={v?.description} rows={4} />
        </F>
      </section>

      <section className="card grid gap-4 p-5 md:p-6">
        <div>
          <h2 className="text-lg">Equipamento</h2>
          <p className="text-sm text-muted">Um item por linha.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURE_CATEGORY_KEYS.map((c) => (
            <div key={c}>
              <label htmlFor={`feat-${c}`} className="label">{FEATURE_CATEGORY_LABELS[c]}</label>
              <textarea id={`feat-${c}`} name={`features_${c}`} className="input !min-h-28 text-sm" defaultValue={features.filter((f) => f.category === c).map((f) => f.label).join("\n")} />
            </div>
          ))}
        </div>
      </section>

      <section className="card grid gap-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Histórico e revisões</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHistory((h) => [...h, { date: new Date().toISOString().slice(0, 10), km: null, description: "" }])}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar entrada
          </button>
        </div>
        {history.length === 0 && <p className="text-sm text-muted">Sem entradas.</p>}
        <ul className="grid gap-3">
          {history.map((h, i) => (
            <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-line p-3 md:grid-cols-[160px_140px_1fr_auto]">
              <div>
                <label className="spec-label" htmlFor={`h-d-${i}`}>Data</label>
                <input id={`h-d-${i}`} type="date" className="input num" value={h.date} onChange={(ev) => setHistory((list) => list.map((x, j) => (j === i ? { ...x, date: ev.target.value } : x)))} />
              </div>
              <div>
                <label className="spec-label" htmlFor={`h-k-${i}`}>Km</label>
                <input id={`h-k-${i}`} type="number" className="input num" value={h.km ?? ""} onChange={(ev) => setHistory((list) => list.map((x, j) => (j === i ? { ...x, km: ev.target.value ? Number(ev.target.value) : null } : x)))} />
              </div>
              <div className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
                <label className="spec-label" htmlFor={`h-t-${i}`}>Descrição</label>
                <input id={`h-t-${i}`} className="input" value={h.description} onChange={(ev) => setHistory((list) => list.map((x, j) => (j === i ? { ...x, description: ev.target.value } : x)))} />
              </div>
              <button type="button" className="btn btn-ghost btn-icon self-end" aria-label={`Remover entrada ${i + 1}`} onClick={() => setHistory((list) => list.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        {e.history && <p className="field-error">{e.history}</p>}
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="min-w-0 flex-1"><FormStatus state={state} /></div>
        <SubmitButton pending={pending}>{v ? "Guardar alterações" : "Criar viatura e adicionar fotos"}</SubmitButton>
      </div>
    </form>
  );
}
