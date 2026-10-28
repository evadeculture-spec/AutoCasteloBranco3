"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useConsent } from "@/components/site/cookie-consent";
import { filtersHref, filtersToSearchParams, type VehicleFilters } from "@/lib/filters";
import { BODY_LABELS, FUEL_LABELS, GEARBOX_LABELS } from "@/lib/labels";
import { parseSmartQuery } from "@/lib/smart-search";
import { formatKm, formatNumber, formatPrice } from "@/lib/format";

const EXAMPLES = [
  "Procuro um SUV gasóleo até 20 000 €",
  "Elétrico para a cidade até 20k",
  "Carrinha automática desde 2019",
  "Familiar com 7 lugares",
  "Híbrido com menos de 50 000 km",
];

const QUICK: { label: string; filters: Partial<VehicleFilters> }[] = [
  { label: "Citadinos", filters: { tipo: ["citadino"] } },
  { label: "SUV", filters: { tipo: ["suv"] } },
  { label: "Familiares", filters: { tipo: ["carrinha", "monovolume"] } },
  { label: "Elétricos/Híbridos", filters: { combustivel: ["eletrico", "hibrido", "hibrido_plugin"] } },
  { label: "Até 15 000 €", filters: { precoMax: 15000 } },
];

const LAST_QUERY_KEY = "acb:ultima-pesquisa";
const noopSubscribe = () => () => {};

export function SmartSearch({ brands, models, initialTotal }: { brands: string[]; models: { brand: string; model: string }[]; initialTotal: number }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [countState, setCountState] = useState<{ qs: string; total: number } | null>(null);
  const [placeholder, setPlaceholder] = useState(0);
  const [navigating, startNav] = useTransition();
  const { consent } = useConsent();
  const inputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => (q.trim() ? parseSmartQuery(q, brands, models) : null), [q, brands, models]);
  const filters: Partial<VehicleFilters> = useMemo(() => {
    if (!parsed) return {};
    const { unmatched: _u, ...rest } = parsed;
    void _u;
    return rest;
  }, [parsed]);
  const qs = filtersToSearchParams(filters).toString();

  // Última pesquisa (só com consentimento de preferências)
  const lastQuery = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(LAST_QUERY_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );

  useEffect(() => {
    if (q) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = window.setInterval(() => setPlaceholder((p) => (p + 1) % EXAMPLES.length), 3500);
    return () => window.clearInterval(t);
  }, [q]);

  // Contador ao vivo
  useEffect(() => {
    if (!qs) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/vehicles/count?${qs}`, { signal: ctrl.signal });
        const data = (await res.json()) as { total: number };
        setCountState({ qs, total: data.total });
      } catch {
        /* pedido cancelado */
      }
    }, 220);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [qs]);
  const count = countState && countState.qs === qs ? countState.total : null;

  const tokens: string[] = [];
  if (filters.marca) tokens.push(filters.marca + (filters.modelo ? ` ${filters.modelo}` : ""));
  filters.tipo?.forEach((t) => tokens.push(BODY_LABELS[t]));
  filters.combustivel?.forEach((c) => tokens.push(FUEL_LABELS[c]));
  if (filters.caixa) tokens.push(GEARBOX_LABELS[filters.caixa]);
  if (filters.precoMin != null) tokens.push(`≥ ${formatPrice(filters.precoMin)}`);
  if (filters.precoMax != null) tokens.push(`≤ ${formatPrice(filters.precoMax)}`);
  if (filters.anoMin != null) tokens.push(`desde ${filters.anoMin}`);
  if (filters.anoMax != null) tokens.push(`até ${filters.anoMax}`);
  if (filters.kmMax != null) tokens.push(`≤ ${formatKm(filters.kmMax)}`);

  const shown = qs ? count : initialTotal;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consent?.preferences) {
      try {
        localStorage.setItem(LAST_QUERY_KEY, q);
      } catch {
        /* ignora */
      }
    }
    startNav(() => router.push(filtersHref(filters)));
  };

  return (
    <div>
      <form role="search" action="/viaturas" method="get" onSubmit={submit} className="relative">
        <label htmlFor={`${id}-q`} className="sr-only">Descreva a viatura que procura</label>
        <div className="flex items-center gap-2 rounded-[18px] border border-ink bg-surface p-2 pl-4 shadow-[0_1px_0_#111214,0_12px_32px_-20px_rgba(17,18,20,0.45)] transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(255,90,31,0.25)]">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            id={`${id}-q`}
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={EXAMPLES[placeholder]}
            autoComplete="off"
            aria-describedby={`${id}-interp`}
            className="min-h-12 w-full min-w-0 bg-transparent text-[17px] outline-none placeholder:text-[#7c7f86] md:text-lg"
          />
          <button type="submit" className="btn btn-primary shrink-0 !min-h-12 !rounded-[12px]" disabled={navigating}>
            <span className="hidden sm:inline">Ver</span>
            <span className="num">{shown == null ? "…" : formatNumber(shown)}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">viaturas</span>
          </button>
        </div>
        <div id={`${id}-interp`} aria-live="polite" className="mt-3 min-h-8">
          {tokens.length > 0 ? (
            <p className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="inline-flex items-center gap-1 text-muted"><Sparkles className="h-3.5 w-3.5 text-signal-ink" aria-hidden="true" /> Entendemos:</span>
              {tokens.map((t) => (
                <span key={t} className="num rounded-md bg-ink px-2 py-0.5 text-[12.5px] text-white">{t}</span>
              ))}
              {count != null && <span className="text-muted">→ <strong className="num text-ink">{count}</strong> {count === 1 ? "resultado" : "resultados"}</span>}
            </p>
          ) : !q.trim() && consent?.preferences && lastQuery ? (
            <button type="button" className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline" onClick={() => setQ(lastQuery)}>
              Repetir última pesquisa: «{lastQuery}»
            </button>
          ) : q.trim() ? (
            <p className="text-sm text-muted">Experimente incluir tipologia, combustível ou orçamento — ex.: «SUV híbrido até 25 000 €».</p>
          ) : null}
        </div>
      </form>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Pesquisas rápidas">
        {QUICK.map((c) => (
          <li key={c.label}>
            <a href={filtersHref(c.filters)} className="chip">{c.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
