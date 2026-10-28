"use client";

import { useId, useState } from "react";
import { monthlyPayment } from "@/lib/finance";
import { formatPercent, formatPrice, formatPriceCents } from "@/lib/format";

const TERMS = [24, 36, 48, 60, 72, 84, 96, 120];

export function FinanceSimulator({ price, tan, taeg, maxMonths, compact = false }: { price: number; tan: number; taeg: number; maxMonths: number; compact?: boolean }) {
  const id = useId();
  const [amount, setAmount] = useState(price);
  const [down, setDown] = useState(Math.round((price * 0.2) / 500) * 500);
  const [months, setMonths] = useState(Math.min(72, maxMonths));
  const terms = TERMS.filter((t) => t <= maxMonths);
  const safeDown = Math.min(down, amount);
  const financed = Math.max(0, amount - safeDown);
  const pmt = monthlyPayment(financed, tan, months);
  const total = pmt * months + safeDown;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line p-5">
        <p className="spec-label">Simulador de financiamento</p>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="num text-[34px] font-semibold leading-none tracking-tight" aria-live="polite">{formatPriceCents(pmt)}</span>
          <span className="text-sm text-muted">/mês</span>
        </p>
        <p className="mt-1 text-xs text-muted">Prestação estimada · {months} meses · TAEG ilustrativa {formatPercent(taeg)}</p>
      </div>
      <div className="grid gap-4 p-5">
        {!compact && (
          <div>
            <label className="label" htmlFor={`${id}-amount`}>Valor da viatura</label>
            <div className="relative">
              <input id={`${id}-amount`} type="number" inputMode="numeric" min={1000} max={200000} step={100} className="input num pr-8" value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
              <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">€</span>
            </div>
          </div>
        )}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label" htmlFor={`${id}-down`}>Entrada inicial</label>
            <span className="num text-sm font-medium">{formatPrice(safeDown)}</span>
          </div>
          <input
            id={`${id}-down`}
            type="range"
            min={0}
            max={Math.max(0, Math.round((amount * 0.6) / 100) * 100)}
            step={250}
            value={safeDown}
            onChange={(e) => setDown(Number(e.target.value))}
            className="h-11 w-full accent-[#ff5a1f]"
            aria-valuetext={formatPrice(safeDown)}
          />
        </div>
        <fieldset>
          <legend className="label">Prazo</legend>
          <div className="flex flex-wrap gap-1.5">
            {terms.map((t) => (
              <button key={t} type="button" className="chip num !min-h-10 !px-3" aria-pressed={months === t} onClick={() => setMonths(t)}>
                {t}m
              </button>
            ))}
          </div>
        </fieldset>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
          {[
            ["Montante financiado", formatPrice(financed)],
            ["TAN fixa", formatPercent(tan)],
            ["TAEG ilustrativa", formatPercent(taeg)],
            ["Total estimado", formatPrice(total)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-3">
              <dt className="spec-label">{k}</dt>
              <dd className="num mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[11.5px] leading-relaxed text-muted">
          Simulação meramente ilustrativa e não vinculativa, sem comissões nem seguros incluídos. Não constitui proposta de crédito.
          A TAEG real depende da análise de risco da instituição financeira parceira. Crédito sujeito a aprovação. Dados fictícios (demonstração).
        </p>
      </div>
    </div>
  );
}
