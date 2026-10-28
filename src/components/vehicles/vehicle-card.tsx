import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FUEL_SHORT, GEARBOX_LABELS } from "@/lib/labels";
import { formatKm, formatPrice } from "@/lib/format";
import type { VehicleCard as Card } from "@/lib/vehicles";
import { CompareToggle, FavoriteButton } from "./vehicle-actions";

export function toStored(v: Card) {
  return { id: v.id, slug: v.slug, title: `${v.brand} ${v.model}`, image: v.cover?.url ?? null, price: v.price };
}

export function VehicleCard({ v, priority = false, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" }: { v: Card; priority?: boolean; sizes?: string }) {
  const stored = toStored(v);
  return (
    <article className="group card relative flex flex-col overflow-hidden transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-[0_8px_24px_-16px_rgba(17,18,20,0.35)]">
      <div className="relative aspect-[3/2] overflow-hidden bg-subtle">
        {v.cover ? (
          <Image
            src={v.cover.url}
            alt={v.cover.alt}
            fill
            sizes={sizes}
            preload={priority}
            loading={priority ? "eager" : "lazy"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="tick-grid grid h-full place-items-center text-sm text-muted">Sem fotografia</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {v.status === "reservado" ? (
            <span className="badge badge-warn">Reservado</span>
          ) : (
            v.revised && (
              <span className="badge badge-ok">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Revisto
              </span>
            )
          )}
          {v.previousPrice && v.previousPrice > v.price && <span className="badge badge-signal">Baixou</span>}
        </div>
        <div className="absolute right-2.5 top-2.5 z-10">
          <FavoriteButton vehicle={stored} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] font-semibold leading-tight">
          <Link href={`/viaturas/${v.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {v.brand} {v.model}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-sm text-muted">{v.version}</p>
        <dl className="mt-3 grid grid-cols-4 overflow-hidden rounded-[10px] border border-line text-center">
          {[
            ["Ano", String(v.year)],
            ["Km", formatKm(v.km).replace(/\s?km$/, "")],
            ["Comb.", FUEL_SHORT[v.fuel]],
            ["Caixa", GEARBOX_LABELS[v.gearbox].slice(0, 4) + "."],
          ].map(([k, val], i) => (
            <div key={k} className={i ? "border-l border-line px-1 py-1.5" : "px-1 py-1.5"}>
              <dt className="spec-label !text-[10px]">{k}</dt>
              <dd className="num truncate text-[12.5px] font-medium">{val}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            {v.previousPrice && v.previousPrice > v.price && (
              <p className="num text-xs text-muted line-through">{formatPrice(v.previousPrice)}</p>
            )}
            <p className="num text-[22px] font-semibold leading-none tracking-tight">{formatPrice(v.price)}</p>
            <p className="mt-1 text-[11px] text-muted">IVA incluído{v.vatDeductible ? " · IVA dedutível" : ""}</p>
          </div>
          <div className="relative z-10">
            <CompareToggle vehicle={stored} compact />
          </div>
        </div>
      </div>
    </article>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="skeleton aspect-[3/2] !rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-11 w-full" />
        <div className="skeleton h-7 w-1/3" />
      </div>
    </div>
  );
}
