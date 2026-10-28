"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Link2, Plus, X } from "lucide-react";
import { compareStore, useList } from "@/lib/list-store";
import { BODY_LABELS, FUEL_LABELS, GEARBOX_LABELS } from "@/lib/labels";
import { cn, formatKm, formatNumber, formatPrice, monthYear } from "@/lib/format";
import type { VehicleSpec } from "@/lib/vehicles";
import { toast } from "@/components/ui/toast";
import { useVehiclesByIds } from "./use-vehicles-by-ids";

type Row = { label: string; get: (v: VehicleSpec) => string; num?: (v: VehicleSpec) => number | null; best?: "min" | "max" };

const ROWS: Row[] = [
  { label: "Preço", get: (v) => formatPrice(v.price), num: (v) => v.price, best: "min" },
  { label: "Registo", get: (v) => monthYear(v.year, v.month), num: (v) => v.year * 100 + (v.month ?? 0), best: "max" },
  { label: "Quilómetros", get: (v) => formatKm(v.km), num: (v) => v.km, best: "min" },
  { label: "Combustível", get: (v) => FUEL_LABELS[v.fuel] },
  { label: "Caixa", get: (v) => GEARBOX_LABELS[v.gearbox] },
  { label: "Tipologia", get: (v) => BODY_LABELS[v.bodyType] },
  { label: "Potência", get: (v) => (v.powerHp ? `${v.powerHp} cv` : "—"), num: (v) => v.powerHp, best: "max" },
  { label: "Cilindrada", get: (v) => (v.engineCc ? `${formatNumber(v.engineCc)} cm³` : "—") },
  { label: "Bateria", get: (v) => (v.batteryKwh ? `${v.batteryKwh} kWh` : "—") },
  { label: "Autonomia", get: (v) => (v.rangeKm ? formatKm(v.rangeKm) : "—"), num: (v) => v.rangeKm, best: "max" },
  { label: "Consumo", get: (v) => v.consumption || "—" },
  { label: "CO₂", get: (v) => (v.co2 != null ? `${v.co2} g/km` : "—"), num: (v) => v.co2, best: "min" },
  { label: "Portas / lugares", get: (v) => `${v.doors ?? "—"} / ${v.seats ?? "—"}`, num: (v) => v.seats, best: "max" },
  { label: "Garantia", get: (v) => `${v.warrantyMonths} meses`, num: (v) => v.warrantyMonths, best: "max" },
  { label: "IVA dedutível", get: (v) => (v.vatDeductible ? "Sim" : "Não") },
  { label: "Cor", get: (v) => v.color || "—" },
];

export function CompareView() {
  const params = useSearchParams();
  const router = useRouter();
  const stored = useList(compareStore);
  const urlIds = (params.get("ids") ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 3);
  const ids = urlIds.length ? urlIds : stored.map((s) => s.id);
  const { items, loading } = useVehiclesByIds(ids);
  const [onlyDiff, setOnlyDiff] = useState(false);

  // Mantém o URL sincronizado com a lista guardada (link partilhável)
  const storedKey = stored.map((s) => s.id).join(",");
  useEffect(() => {
    if (!urlIds.length && storedKey) router.replace(`/comparar?ids=${storedKey}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedKey]);

  const remove = (id: string) => {
    compareStore.remove(id);
    const next = ids.filter((x) => x !== id);
    router.replace(next.length ? `/comparar?ids=${next.join(",")}` : "/comparar", { scroll: false });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copiado");
    } catch {
      toast("Não foi possível copiar o link");
    }
  };

  if (!ids.length) {
    return (
      <div className="card tick-grid flex flex-col items-start gap-4 p-8 md:p-12">
        <h2 className="text-2xl">Ainda não escolheu viaturas para comparar</h2>
        <p className="max-w-lg text-ink-2">Na listagem ou no detalhe, toque em «Comparar» em até 3 viaturas. Aparecem aqui lado a lado, com as diferenças destacadas.</p>
        <Link href="/viaturas" className="btn btn-primary">Escolher viaturas</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3" aria-busy="true" aria-label="A carregar comparação">
        {ids.map((id) => <div key={id} className="skeleton h-80" />)}
      </div>
    );
  }

  const rows = ROWS.map((r) => {
    const values = items.map(r.get);
    const differs = new Set(values).size > 1;
    let bestIdx: number[] = [];
    if (r.num && r.best && differs) {
      const nums = items.map((v) => r.num!(v));
      const valid = nums.filter((n): n is number => n != null);
      if (valid.length > 1) {
        const target = r.best === "min" ? Math.min(...valid) : Math.max(...valid);
        bestIdx = nums.map((n, i) => (n === target ? i : -1)).filter((i) => i >= 0);
      }
    }
    return { ...r, values, differs, bestIdx };
  }).filter((r) => (onlyDiff ? r.differs : r.values.some((v) => v !== "—")));

  const cols = Math.max(items.length, 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="h-5 w-5 accent-[#111214]" />
          Mostrar só diferenças
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="btn btn-secondary btn-sm"><Link2 className="h-4 w-4" aria-hidden="true" /> Copiar link</button>
          {items.length < 3 && <Link href="/viaturas" className="btn btn-secondary btn-sm"><Plus className="h-4 w-4" aria-hidden="true" /> Adicionar</Link>}
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">Comparação de {items.length} viaturas. Os melhores valores estão assinalados.</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-28 bg-surface p-3 text-left align-bottom md:w-44"><span className="spec-label">Viatura</span></th>
              {items.map((v) => (
                <th key={v.id} scope="col" className="p-3 text-left align-top font-normal" style={{ width: `${100 / cols}%` }}>
                  <div className="relative">
                    <Link href={`/viaturas/${v.slug}`} className="block overflow-hidden rounded-xl border border-line">
                      <div className="relative aspect-[3/2] bg-subtle">
                        {v.cover && <Image src={v.cover.url} alt={v.cover.alt} fill sizes="(min-width: 768px) 25vw, 40vw" className="object-cover" />}
                      </div>
                    </Link>
                    <button type="button" onClick={() => remove(v.id)} className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface" aria-label={`Remover ${v.brand} ${v.model} da comparação`}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <Link href={`/viaturas/${v.slug}`} className="mt-2.5 block text-[15px] font-semibold leading-tight hover:underline">{v.brand} {v.model}</Link>
                  <p className="truncate text-[13px] text-muted">{v.version}</p>
                  {v.status === "reservado" && <span className="badge badge-warn mt-1.5">Reservado</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={cn("border-t border-line", r.differs && "bg-[#fffaf7]")}>
                <th scope="row" className={cn("sticky left-0 z-10 p-3 text-left font-normal text-muted", r.differs ? "bg-[#fffaf7]" : "bg-surface")}>
                  <span className="flex items-center gap-1.5">
                    {r.differs && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />}
                    {r.label}
                    {r.differs && <span className="sr-only">(diferente)</span>}
                  </span>
                </th>
                {r.values.map((val, i) => (
                  <td key={i} className="num p-3 font-medium">
                    <span className={cn(r.bestIdx.includes(i) && "rounded-md bg-ok-soft px-1.5 py-0.5 text-ok")}>
                      {val}
                      {r.bestIdx.includes(i) && <span className="sr-only"> (melhor)</span>}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" /> valores diferentes</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-ok-soft" aria-hidden="true" /> melhor valor</span>
      </p>
    </div>
  );
}
