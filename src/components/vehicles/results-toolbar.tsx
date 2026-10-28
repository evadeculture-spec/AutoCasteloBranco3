"use client";

import { X } from "lucide-react";
import { SORT_OPTIONS, type SortKey, type VehicleFilters } from "@/lib/filters";
import { BODY_LABELS, FUEL_LABELS, GEARBOX_LABELS } from "@/lib/labels";
import { formatKm, formatNumber, formatPrice } from "@/lib/format";
import { useFilterNavigation } from "./filters-panel";

export function ResultsToolbar({ filters, total }: { filters: VehicleFilters; total: number }) {
  const { apply, pending } = useFilterNavigation(filters);
  const chips: { label: string; clear: Partial<VehicleFilters> }[] = [];
  if (filters.marca) chips.push({ label: filters.marca, clear: { marca: undefined, modelo: undefined } });
  if (filters.modelo) chips.push({ label: filters.modelo, clear: { modelo: undefined } });
  if (filters.precoMin != null || filters.precoMax != null)
    chips.push({
      label:
        filters.precoMin != null && filters.precoMax != null
          ? `${formatPrice(filters.precoMin)} – ${formatPrice(filters.precoMax)}`
          : filters.precoMax != null
            ? `até ${formatPrice(filters.precoMax)}`
            : `desde ${formatPrice(filters.precoMin!)}`,
      clear: { precoMin: undefined, precoMax: undefined },
    });
  if (filters.anoMin != null || filters.anoMax != null)
    chips.push({ label: `${filters.anoMin ?? "…"}–${filters.anoMax ?? "…"}`, clear: { anoMin: undefined, anoMax: undefined } });
  if (filters.kmMax != null) chips.push({ label: `até ${formatKm(filters.kmMax)}`, clear: { kmMax: undefined } });
  filters.combustivel.forEach((k) => chips.push({ label: FUEL_LABELS[k], clear: { combustivel: filters.combustivel.filter((x) => x !== k) } }));
  if (filters.caixa) chips.push({ label: GEARBOX_LABELS[filters.caixa], clear: { caixa: undefined } });
  filters.tipo.forEach((k) => chips.push({ label: BODY_LABELS[k], clear: { tipo: filters.tipo.filter((x) => x !== k) } }));

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2" aria-live="polite" aria-atomic="true">
          {pending ? (
            "A procurar…"
          ) : (
            <>
              <span className="num text-base font-semibold text-ink">{formatNumber(total)}</span> {total === 1 ? "viatura encontrada" : "viaturas encontradas"}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="ordem" className="text-sm text-muted">Ordenar</label>
          <select id="ordem" className="input !min-h-10 !w-auto !py-1.5 text-sm" value={filters.ordem} onChange={(e) => apply({ ordem: e.target.value as SortKey })}>
            {Object.entries(SORT_OPTIONS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtros ativos">
          {chips.map((c) => (
            <li key={c.label}>
              <button type="button" className="chip !min-h-9 !bg-subtle !pr-2" onClick={() => apply(c.clear)} aria-label={`Remover filtro ${c.label}`}>
                <span className="num text-[13px]">{c.label}</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
