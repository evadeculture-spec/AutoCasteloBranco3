"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { countActiveFilters, filtersHref, type VehicleFilters } from "@/lib/filters";
import { BODY_KEYS, BODY_LABELS, FUEL_KEYS, FUEL_LABELS, GEARBOX_LABELS, type BodyKey, type FuelKey } from "@/lib/labels";
import { cn, formatKm, formatNumber, formatPrice } from "@/lib/format";
import type { Facets } from "@/lib/vehicles";
import { KM_STEPS, PRICE_STEPS, yearRange } from "./filter-options";

type Props = { filters: VehicleFilters; facets: Facets; total: number };

export function useFilterNavigation(filters: VehicleFilters) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const apply = (patch: Partial<VehicleFilters>) => {
    const next = { ...filters, ...patch, pagina: patch.pagina ?? 1 };
    if (patch.marca !== undefined && patch.marca !== filters.marca) next.modelo = undefined;
    startTransition(() => router.replace(filtersHref(next), { scroll: false }));
  };
  return { apply, pending };
}

function FilterFields({ filters, facets, apply }: { filters: VehicleFilters; facets: Facets; apply: (p: Partial<VehicleFilters>) => void }) {
  const id = useId();
  const brand = facets.brands.find((b) => b.brand === filters.marca);
  const years = yearRange(facets.yearMin, facets.yearMax);
  const toggle = <T extends string>(list: T[], key: T) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  const num = (v: string) => (v ? Number(v) : undefined);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label htmlFor={`${id}-marca`} className="label">Marca</label>
          <select id={`${id}-marca`} className="input" value={filters.marca ?? ""} onChange={(e) => apply({ marca: e.target.value || undefined })}>
            <option value="">Todas as marcas</option>
            {facets.brands.map((b) => (
              <option key={b.brand} value={b.brand}>{b.brand} ({b.count})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-modelo`} className="label">Modelo</label>
          <select
            id={`${id}-modelo`}
            className="input disabled:bg-subtle disabled:text-muted"
            value={filters.modelo ?? ""}
            disabled={!brand}
            aria-describedby={!brand ? `${id}-modelo-hint` : undefined}
            onChange={(e) => apply({ modelo: e.target.value || undefined })}
          >
            <option value="">{brand ? "Todos os modelos" : "Escolha primeiro a marca"}</option>
            {brand?.models.map((m) => (
              <option key={m.model} value={m.model}>{m.model} ({m.count})</option>
            ))}
          </select>
          {!brand && <p id={`${id}-modelo-hint`} className="sr-only">Escolha primeiro a marca para ver os modelos.</p>}
        </div>
      </div>

      <fieldset>
        <legend className="label">Preço (IVA incluído)</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${id}-pmin`}>Preço mínimo</label>
          <select id={`${id}-pmin`} className="input num" value={filters.precoMin ?? ""} onChange={(e) => apply({ precoMin: num(e.target.value) })}>
            <option value="">Mín.</option>
            {PRICE_STEPS.map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
          </select>
          <label className="sr-only" htmlFor={`${id}-pmax`}>Preço máximo</label>
          <select id={`${id}-pmax`} className="input num" value={filters.precoMax ?? ""} onChange={(e) => apply({ precoMax: num(e.target.value) })}>
            <option value="">Máx.</option>
            {PRICE_STEPS.map((p) => <option key={p} value={p}>{formatPrice(p)}</option>)}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Ano</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${id}-amin`}>Ano mínimo</label>
          <select id={`${id}-amin`} className="input num" value={filters.anoMin ?? ""} onChange={(e) => apply({ anoMin: num(e.target.value) })}>
            <option value="">Desde</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <label className="sr-only" htmlFor={`${id}-amax`}>Ano máximo</label>
          <select id={`${id}-amax`} className="input num" value={filters.anoMax ?? ""} onChange={(e) => apply({ anoMax: num(e.target.value) })}>
            <option value="">Até</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${id}-km`} className="label">Quilómetros (máx.)</label>
        <select id={`${id}-km`} className="input num" value={filters.kmMax ?? ""} onChange={(e) => apply({ kmMax: num(e.target.value) })}>
          <option value="">Qualquer</option>
          {KM_STEPS.map((k) => <option key={k} value={k}>até {formatKm(k)}</option>)}
        </select>
      </div>

      <fieldset>
        <legend className="label">Combustível</legend>
        <div className="flex flex-wrap gap-2">
          {FUEL_KEYS.map((k: FuelKey) => (
            <button key={k} type="button" className="chip" aria-pressed={filters.combustivel.includes(k)} onClick={() => apply({ combustivel: toggle(filters.combustivel, k) })}>
              {FUEL_LABELS[k]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Caixa</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-line-strong bg-surface p-1">
          {([undefined, "manual", "automatica"] as const).map((k) => (
            <label
              key={k ?? "todas"}
              className={cn(
                "flex min-h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
                filters.caixa === k ? "bg-ink text-white" : "hover:bg-subtle",
              )}
            >
              <input
                type="radio"
                name={`${id}-caixa`}
                className="sr-only"
                checked={filters.caixa === k}
                onChange={() => apply({ caixa: k })}
              />
              {k ? GEARBOX_LABELS[k] : "Todas"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Tipologia</legend>
        <div className="flex flex-wrap gap-2">
          {BODY_KEYS.map((k: BodyKey) => (
            <button key={k} type="button" className="chip" aria-pressed={filters.tipo.includes(k)} onClick={() => apply({ tipo: toggle(filters.tipo, k) })}>
              {BODY_LABELS[k]}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function FiltersPanel({ filters, facets, total }: Props) {
  const { apply, pending } = useFilterNavigation(filters);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const active = countActiveFilters(filters);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const clear = () => apply({ marca: undefined, modelo: undefined, precoMin: undefined, precoMax: undefined, anoMin: undefined, anoMax: undefined, kmMax: undefined, combustivel: [], caixa: undefined, tipo: [] });

  return (
    <>
      {/* Desktop */}
      <aside aria-label="Filtros" className="hidden lg:block">
        <div className="card sticky top-20 p-5" aria-busy={pending}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">Filtros</h2>
            {active > 0 && (
              <button type="button" onClick={clear} className="text-sm font-medium text-signal-ink underline-offset-2 hover:underline">
                Limpar ({active})
              </button>
            )}
          </div>
          <FilterFields filters={filters} facets={facets} apply={apply} />
        </div>
      </aside>

      {/* Mobile */}
      <div className="lg:hidden">
        <button type="button" className="btn btn-secondary w-full" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filtros
          {active > 0 && <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[11px] text-ink">{active}</span>}
        </button>
        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          aria-labelledby="filtros-titulo"
          className="m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 backdrop:bg-ink/40"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
              <h2 id="filtros-titulo" className="text-lg font-semibold">Filtros</h2>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Fechar filtros">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <FilterFields filters={filters} facets={facets} apply={apply} />
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-line bg-surface p-3">
              <button type="button" className="btn btn-secondary" onClick={clear} disabled={!active}>Limpar</button>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)} aria-live="polite">
                {pending ? "A atualizar…" : `Ver ${formatNumber(total)} ${total === 1 ? "viatura" : "viaturas"}`}
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}
